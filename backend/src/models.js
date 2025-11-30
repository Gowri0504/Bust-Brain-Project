import mongoose from "mongoose"

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      uid: String,
      name: String,
      email: String,
      token: String,
      refresh: String,
      loginAt: Date
    },
    { timestamps: true }
  )
)

const QSchema = new mongoose.Schema(
  {
    key: String,
    fieldId: String,
    label: String,
    type: String,
    req: Boolean,
    opts: [String],
    rules: {
      logic: String,
      conditions: [
        {
          questionKey: String,
          operator: String,
          value: mongoose.Schema.Types.Mixed
        }
      ]
    }
  },
  { _id: false }
)

const Form = mongoose.model(
  "Form",
  new mongoose.Schema(
    {
      owner: String,
      baseId: String,
      tableId: String,
      tableName: String,
      qs: [QSchema]
    },
    { timestamps: true }
  )
)

const Resp = mongoose.model(
  "Resp",
  new mongoose.Schema(
    {
      formId: String,
      airtableRecordId: String,
      answers: mongoose.Schema.Types.Mixed,
      status: String,
      deletedInAirtable: { type: Boolean, default: false }
    },
    { timestamps: true }
  )
)

export { User, Form, Resp }

