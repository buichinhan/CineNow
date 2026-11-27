const mongoose = require("mongoose");

const { Schema } = mongoose;

const accountStatusHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    action: {
      type: String,
      enum: ["LOCK", "UNLOCK"],
      required: true,
      immutable: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 300,
      immutable: true,
    },

    previousStatus: {
      type: String,
      enum: ["ACTIVE", "LOCKED"],
      required: true,
      immutable: true,
    },

    newStatus: {
      type: String,
      enum: ["ACTIVE", "LOCKED"],
      required: true,
      immutable: true,
    },

    operationId: {
      type: String,
      required: true,
      lowercase: true,
      immutable: true,
      match: /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  }
);

accountStatusHistorySchema.pre("validate", function () {
  const validLock =
    this.action === "LOCK" &&
    this.previousStatus === "ACTIVE" &&
    this.newStatus === "LOCKED";

  const validUnlock =
    this.action === "UNLOCK" &&
    this.previousStatus === "LOCKED" &&
    this.newStatus === "ACTIVE";

  if (!validLock && !validUnlock) {
    this.invalidate(
      "newStatus",
      "Invalid account status transition"
    );
  }

  if (
    this.userId &&
    this.performedBy &&
    String(this.userId) === String(this.performedBy)
  ) {
    this.invalidate(
      "performedBy",
      "Self account status modification is not allowed"
    );
  }
});

accountStatusHistorySchema.index(
  { userId: 1, createdAt: -1, _id: -1 },
  { name: "account_status_history_user" }
);

accountStatusHistorySchema.index(
  { operationId: 1 },
  {
    name: "uniq_account_status_operation",
    unique: true,
  }
);

module.exports = mongoose.model(
  "AccountStatusHistory",
  accountStatusHistorySchema
);