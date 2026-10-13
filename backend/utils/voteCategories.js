const ROYAL_COUPLE_CATEGORY = {
  id: 'couple_royal',
  label: 'Roi & Reine du Bal',
  tone: 'king',
  description: 'Vote pour le couple qui incarnera ensemble l elegance et l esprit du bal.'
};

const buildInitials = (roiName, reineName) => {
  const firstInitial = String(roiName || '').trim().charAt(0).toUpperCase();
  const secondInitial = String(reineName || '').trim().charAt(0).toUpperCase();
  return `${firstInitial || 'R'}${secondInitial || 'R'}`;
};

const normalizeCouple = (couple) => ({
  id: String(couple.id),
  name: `${couple.roi_name} & ${couple.reine_name}`,
  initials: buildInitials(couple.roi_name, couple.reine_name),
  meta: `${couple.roi_name} - Roi | ${couple.reine_name} - Reine`,
  description: couple.description || 'Couple candidat au titre de Roi et Reine du Bal.',
  roi_name: couple.roi_name,
  reine_name: couple.reine_name,
  roi_photo: couple.roi_photo || '',
  reine_photo: couple.reine_photo || ''
});

module.exports = { ROYAL_COUPLE_CATEGORY, normalizeCouple };
