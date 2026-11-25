import {model,Schema} from "mongoose"
import mongoose from "mongoose"
import dotenv from 'dotenv'
dotenv.config();

mongoose.connect(process.env.MONGO_URL as string)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.error("MongoDB connection error", err));

const userSchema = new Schema({
  username:{type:String,unique:true},
  password:String
});

const contentSchema = new Schema({
    title: String,
    link: String,
    type: { type: String, default: "link" },
    description: String,
    image: String,
    siteName: String,
    favicon: String,
    tags: { type: [String], default: [] },
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

const linkSchema = new Schema({
  hash:String,
  userId:{type:mongoose.Types.ObjectId, ref:'User',required:true,unique:true}
})

export const LinkModel=model('Links',linkSchema)
export const UserModel = model('User', userSchema);
export const ContentModel=model('Content', contentSchema);

