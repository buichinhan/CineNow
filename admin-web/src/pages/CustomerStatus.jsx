import { useEffect, useRef, useState } from "react";
import { Lock, Unlock, RefreshCw } from "lucide-react";

import {
  getAdminToken,
  getAdminCustomerStatus,
  changeAdminCustomerStatus
} from "../services/api";

const UUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

async function sessionFingerprint(token) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Trình duyệt không hỗ trợ xác thực an toàn.");
  }

  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, "0"))
    .join("");
}

function readPending(key) {
  const raw = sessionStorage.getItem(key);

  if (!raw) return null;

  const operation = JSON.parse(raw);

  if (
    typeof operation?.fingerprint !== "string" ||
    !["lock", "unlock"].includes(operation?.payload?.action) ||
    typeof operation.payload.reason !== "string" ||
    operation.payload.reason.trim().length < 5 ||
    operation.payload.reason.trim().length > 300 ||
    !UUID_PATTERN.test(operation.payload.operationId || "")
  ) {
    throw new Error("Dữ liệu giao dịch chờ không hợp lệ.");
  }

  return operation;
}

export default function CustomerStatus({
  customerId,
  customerName,
  accountStatus,
  onStatusChanged
}) {
  const storageKey = `cinenow_pending_status_v2_${customerId}`;

  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem(storageKey));
    } catch {
      return false;
    }
  });

  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const controllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const validStatus = ["active", "locked"].includes(accountStatus);
  const locked = accountStatus === "locked";

  const label = pending
    ? "Kiểm tra lại giao dịch"
    : locked
      ? "Mở khóa tài khoản"
      : "Khóa tài khoản";

  async function toggleStatus() {
    if (busyRef.current || !validStatus) return;

    busyRef.current = true;
    setBusy(true);

    let refreshRequired = false;

    try {
      const token = getAdminToken();

      if (!token) {
        throw new Error("Phiên đăng nhập không hợp lệ.");
      }

      const fingerprint = await sessionFingerprint(token);
      let operation = readPending(storageKey);

      if (operation && operation.fingerprint !== fingerprint) {
        throw new Error(
          "Giao dịch trước thuộc phiên quản trị khác. " +
          "Cần đối soát trước khi thực hiện thao tác mới."
        );
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      const latest = await getAdminCustomerStatus(customerId, {
        page: 1,
        limit: 1,
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(15000)
        ])
      });

      if (!mountedRef.current) return;

      if (getAdminToken() !== token) {
        throw new Error("Phiên quản trị đã thay đổi.");
      }

      if (!latest.canChangeStatus) {
        throw new Error("Chức năng khóa chưa được kích hoạt.");
      }

      if (!operation && latest.isLocked !== locked) {
        refreshRequired = true;

        window.alert(
          "Trạng thái tài khoản đã thay đổi. " +
          "Danh sách sẽ được cập nhật."
        );

        return;
      }

      if (operation) {
        const actionName = operation.payload.action === "lock"
          ? "Khóa tài khoản"
          : "Mở khóa tài khoản";

        const confirmed = window.confirm(
          "Kiểm tra lại giao dịch chưa xác nhận?\n\n" +
          `Thao tác: ${actionName}\n` +
          `Lý do: ${operation.payload.reason}\n\n` +
          "Hệ thống sử dụng lại mã giao dịch cũ."
        );

        if (!confirmed) return;
      } else {
        const action = latest.isLocked ? "unlock" : "lock";

        const actionName = latest.isLocked
          ? "Mở khóa tài khoản"
          : "Khóa tài khoản";

        const reason = window.prompt(
          `${actionName}: ${customerName || customerId}\n\n` +
          "Nhập lý do từ 5 đến 300 ký tự:"
        );

        if (reason === null) return;

        const normalized = reason.trim();

        if (normalized.length < 5 || normalized.length > 300) {
          throw new Error("Lý do phải từ 5 đến 300 ký tự.");
        }

        const confirmed = window.confirm(
          `${actionName}?\n\n` +
          `Khách hàng: ${customerName || customerId}\n` +
          `Lý do: ${normalized}\n\n` +
          "Vé và điểm thành viên được giữ nguyên."
        );

        if (!confirmed) return;

        if (!globalThis.crypto?.randomUUID) {
          throw new Error("Không thể tạo mã giao dịch an toàn.");
        }

        operation = {
          fingerprint,
          payload: {
            action,
            reason: normalized,
            operationId: crypto.randomUUID()
          }
        };
      }

      if (!mountedRef.current) return;

      if (getAdminToken() !== token) {
        throw new Error("Phiên quản trị đã thay đổi.");
      }

      sessionStorage.setItem(
        storageKey,
        JSON.stringify(operation)
      );

      setPending(true);
      refreshRequired = true;

      await changeAdminCustomerStatus(
        customerId,
        operation.payload
      );

      sessionStorage.removeItem(storageKey);

      if (mountedRef.current) {
        setPending(false);
      }
    } catch (error) {
      if (mountedRef.current) {
        window.alert(
          error.message || "Không thể xác nhận giao dịch."
        );
      }
    } finally {
      controllerRef.current = null;
      busyRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }

      if (refreshRequired) {
        onStatusChanged?.();
      }
    }
  }

  return (
    <div className="cm-account-control">
      <button
        className={
          `cm-button cm-icon-button ${
            locked ? "cm-unlock-action" : "cm-lock-action"
          }`
        }
        type="button"
        disabled={busy || !validStatus}
        title={label}
        aria-label={label}
        onClick={toggleStatus}
      >
        {busy
          ? <RefreshCw size={16} className="cm-spin" />
          : pending
            ? <RefreshCw size={16} />
            : locked
              ? <Unlock size={17} />
              : <Lock size={17} />}
      </button>

      <span
        className={
          `cm-account-label ${
            locked ? "cm-account-locked" : "cm-account-active"
          }`
        }
      >
        {pending
          ? "Chờ xác nhận"
          : !validStatus
            ? "Không xác định"
            : locked
              ? "Đã khóa"
              : "Hoạt động"}
      </span>
    </div>
  );
}