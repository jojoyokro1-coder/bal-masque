const EVENT_DATE_ISO = '2026-09-04T19:00:00.000Z';
const EVENT_LOCATION = 'Espace Le Villier, Yopougon Chambéry';

const normalizeEventInfo = (event) => {
  if (!event) return event;

  return {
    ...event,
    date_evenement: EVENT_DATE_ISO,
    lieu: EVENT_LOCATION
  };
};

module.exports = {
  EVENT_DATE_ISO,
  EVENT_LOCATION,
  normalizeEventInfo
};
