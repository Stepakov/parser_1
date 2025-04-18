// import { config } from 'dotenv'
import 'dotenv/config'
import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.Email_User,
        pass: process.env.Email_Password,
    },
});

// async..await is not allowed in global scope, must use a wrapper
async function main() {
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"Sasha 👻" sanechkaskripkin2@gmail.com', // sender address
        to: "trueukraine2019@gmail.com", // list of receivers
        subject: `Parser Oleole ✔ ${Date.now()}`, // Subject line
        text: "parser oleole.pl", // plain text body
        html: "<b>Hello world?</b>", // html body
        attachments: [{
            filename: "./all_products.xlsx",
            path: "./all_products.xlsx",
            cid: "unique"
        }]
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

main().catch(console.error);