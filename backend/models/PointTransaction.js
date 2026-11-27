const mongoose = require('mongoose');

const ADMIN_TYPES = new Set([
  'ADMIN_ADD',
  'ADMIN_DEDUCT',
]);

function isAdminAdjustment() {
  return ADMIN_TYPES.has(this.type);
}

function isNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

const pointTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },

    bookingCode: {
      type: String,
      default: null,
    },

    type: {
      type: String,
      enum: [
        'EARN',
        'REDEEM',
        'REFUND',
        'ADMIN_ADD',
        'ADMIN_DEDUCT',
      ],
      required: true,
    },

    points: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          if (!isAdminAdjustment.call(this)) {
            return true;
          }

          return (
            Number.isSafeInteger(value) &&
            Math.abs(value) <= 10000 &&
            (
              this.type === 'ADMIN_ADD'
                ? value > 0
                : value < 0
            )
          );
        },
        message: 'Invalid admin point adjustment.',
      },
    },

    balanceAfter: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          return (
            !isAdminAdjustment.call(this) ||
            isNonNegativeInteger(value)
          );
        },
        message: 'Invalid point balance.',
      },
    },

    description: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(value) {
          return (
            !isAdminAdjustment.call(this) ||
            (
              typeof value === 'string' &&
              value.length >= 5 &&
              value.length <= 300
            )
          );
        },
        message: 'Invalid adjustment reason.',
      },
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: isAdminAdjustment,
      immutable: true,
    },

    balanceBefore: {
      type: Number,
      required: isAdminAdjustment,
      validate: {
        validator: isNonNegativeInteger,
        message: 'Invalid previous balance.',
      },
      immutable: true,
    },

    debtBefore: {
      type: Number,
      required: isAdminAdjustment,
      validate: {
        validator: isNonNegativeInteger,
        message: 'Invalid previous debt.',
      },
      immutable: true,
    },

    debtAfter: {
      type: Number,
      required: isAdminAdjustment,
      validate: {
        validator: isNonNegativeInteger,
        message: 'Invalid remaining debt.',
      },
      immutable: true,
    },

    operationId: {
      type: String,
      trim: true,
      required: isAdminAdjustment,
      immutable: true,
      validate: {
        validator(value) {
          return (
            !isAdminAdjustment.call(this) ||
            (
              typeof value === 'string' &&
              /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)
            )
          );
        },
        message: 'Invalid operation ID.',
      },
    },
  },
  {
    timestamps: true,
  }
);

pointTransactionSchema.pre('validate', function () {
  if (!isAdminAdjustment.call(this)) {
    return;
  }

  const values = [
    this.balanceBefore,
    this.balanceAfter,
    this.debtBefore,
    this.debtAfter,
  ];

  if (!values.every(isNonNegativeInteger)) {
    return;
  }

  if (this.type === 'ADMIN_ADD') {
    const debtPaid = Math.min(
      this.points,
      this.debtBefore
    );

    const expectedDebt = this.debtBefore - debtPaid;

    const expectedBalance =
      this.balanceBefore + this.points - debtPaid;

    if (
      this.debtAfter !== expectedDebt ||
      this.balanceAfter !== expectedBalance
    ) {
      this.invalidate(
        'balanceAfter',
        'Inconsistent point adjustment.'
      );
    }
  }

  if (this.type === 'ADMIN_DEDUCT') {
    if (
      this.balanceAfter !==
        this.balanceBefore + this.points ||
      this.debtAfter !== this.debtBefore
    ) {
      this.invalidate(
        'balanceAfter',
        'Inconsistent point deduction.'
      );
    }
  }
});

pointTransactionSchema.index(
  { operationId: 1 },
  {
    name: 'uniq_admin_point_operation',
    unique: true,
    partialFilterExpression: {
      operationId: { $type: 'string' },
    },
  }
);

module.exports = mongoose.model(
  'PointTransaction',
  pointTransactionSchema
);