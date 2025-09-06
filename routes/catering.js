const express = require('express');
const router = express.Router();
const pool = require('../db/client');
const nodemailer = require('nodemailer');

// transporter config
const transporter = nodemailer.createTransport({
  host: 'smtp.mail.yahoo.com',
  port: 465,
  secure: true,       // true for port 465 (SSL), false for 587 (TLS)
  auth: {
    user: 'chocolate_4life@yahoo.com',
    pass: process.env.EMAIL_PASS
  }
});

router.post('/catering', async (req, res) => {
  console.log('Received catering request:', req.body);

  const {
    'event-type': eventType,
    'pie-types': pieTypes,
    'guest-count': guestCount,
    'signage-idea': signageIdea,
    'event-date': eventDate,
    'first-name': firstName,
    'last-name': lastName,
    phone,
    email
  } = req.body;

  let normalizedPieTypes = pieTypes;
  if (!Array.isArray(pieTypes)) {
    normalizedPieTypes = [pieTypes];
  }

  try {
    // Insert into the database
    await pool.query(
      `INSERT INTO catering_requests (
          event_type, pie_types, guest_count, signage_idea,
          event_date, first_name, last_name, phone, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        eventType,
        normalizedPieTypes,
        guestCount,
        signageIdea,
        eventDate,
        firstName,
        lastName,
        phone,
        email
      ]
    );

    // Prepare the email options AFTER successful DB insert
    const mailOptions = {
      from: 'chocolate_4life@yahoo.com',
      cc: 'chocolate_4life@yahoo.com',
      to: email,
      subject: 'Your Catering Request Confirmation',
      text: `
Thank you for your catering request! Here are the details:
Event Type: ${eventType}
Pies: ${normalizedPieTypes.join(', ')}
Guest Count: ${guestCount}
Signage Idea: ${signageIdea}
Event Date: ${eventDate}
Name: ${firstName} ${lastName}
Phone: ${phone}
Email: ${email}
`
};

    // Send confirmation email
    await transporter.sendMail(mailOptions);

    // If both DB and email succeed:
    res.status(201).json({ message: 'Catering request saved and email sent!' });

  } catch (err) {
    console.error('Error processing catering request:', err);

    // Differentiate error message for email failure or DB failure
    if (err.response && err.response.includes('Failed to send')) {
      // Email failed but DB succeeded (you can customize this further)
      res.status(201).json({ message: 'Request saved but failed to send confirmation email' });
    } else {
      // General failure (DB or email)
      res.status(500).json({ error: 'Failed to process catering request' });
    }
  }
});

module.exports = router;
