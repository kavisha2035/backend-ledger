//require('dotenv').config();
const nodemailer = require('nodemailer');

const authConfig = process.env.EMAIL_PASS
  ? {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  : {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    };

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: authConfig,
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }


};

async function sendRegisterationEmail(userEmail,name){
    const subject='Welcome to backend ledger';
    const text=`Hello ${name},\n\n Thank you for registering at Backend Ledger.
    We are excited to have you on board !\n\n Best Regards ,\nThe Backend Ledger Team  `;
    const html=`<p>Hello ${name},</p><p> Thank You for the regestration at the Backend ledger.
    We are excited to have you on board!</p><p> Best Regards,<br> The Backend Ledger Team</p>`;

    await sendEmail(userEmail,subject,text,html);
}

async function sendTransactionEmail(userEmail,name,amount,toAccount){
  const subject='Transaction successful'
  const text=`Hello ${name}, Your transaction of ${amount} to account ${toAccount} was successful.Best Regards,\n The Backend Ledger Team.`
  const html=`<p>Hello ${name}, Your transaction of ${amount} to account ${toAccount} was successful.Best Regards,\n The Backend Ledger Team.</p> `

  await sendEmail(userEmail,subject,text,html);
}

async function sendTransactionFailureEmail(userEmail,name,amount,toAccount){
  const subject='Transaction failed'
  const text=`Hello ${name}, We regret to inform you that your transaction of ${amount} to account ${toAccount} was unsuccessful.Best Regards,\n The Backend Ledger Team.`
  const html=`<p>Hello ${name}, We regret to inform oyu that your transaction of ${amount} to account ${toAccount} was unsuccessful.Best Regards,\n The Backend Ledger Team.</p> `

  await sendEmail(userEmail,subject,text,html);
}



module.exports = {
    sendRegisterationEmail,
    transporter,
    sendTransactionEmail,
    sendTransactionFailureEmail
};
