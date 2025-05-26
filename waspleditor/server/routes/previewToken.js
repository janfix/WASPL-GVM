import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/token/preview', (req, res) => {
  const payload = {
    _id: "preview",
    firstname: "Preview",
    lastname: "Mode",
    groups: [],
  };

  const token = jwt.sign(payload, process.env.TESTRUNNER_SECRET || "changeme_waspl_secret", {
    expiresIn: '5m',
  });

  res.json({ token });
});

export default router;
