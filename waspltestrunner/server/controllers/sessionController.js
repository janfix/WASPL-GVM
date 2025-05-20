import Session from '../models/session.js';

export const updateSessionAccessStatus = async (req, res) => {
  const sessionId = req.params.id;
  const { accessStatus } = req.body;

  try {
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { accessStatus },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session introuvable' });
    }

    res.status(200).json({ message: 'Session mise à jour', session });
  } catch (error) {
    console.error('Erreur update accessStatus:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
