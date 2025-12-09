import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendResetPasswordEmail = async (to: string, token: string) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject: 'Password Reset Request - PersonaGrid',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #646cff;">Password Reset Request</h2>
        <p>You requested a password reset for your PersonaGrid account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #646cff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The PersonaGrid Team</p>
      </div>
    `,
    };

    try {
        console.log('Attempting to send email to:', to);
        console.log('SMTP Config:', {
            user: process.env.SMTP_USER ? 'Set' : 'Missing',
            pass: process.env.SMTP_PASS ? 'Set' : 'Missing',
        });
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send password reset email');
    }
};
