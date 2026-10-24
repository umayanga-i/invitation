export type GuestLanguage = 'en' | 'si' | 'ta';

export const guestMessages = {
  en: {
    language: 'Language', youAreInvited: 'You’re invited', rsvpQuestion: 'Will you attend?', attending: 'Attending',
    notAttending: 'Not attending', maybe: 'Maybe', partySize: 'Party size', message: 'Message (optional)',
    name: 'Your name', phone: 'Phone (optional)', sendRsvp: 'Send RSVP', updateRsvp: 'Update my RSVP', saving: 'Saving…',
    thankYou: 'Thank you', responseSaved: 'Your response is saved', changeAnswer: 'Change my answer', cancel: 'Cancel',
    closed: 'RSVP closed', closedDescription: 'The RSVP deadline has passed.', existingAnswer: 'Your existing answer',
    noAnswer: 'You did not submit a response before the deadline.', addCalendar: 'Add to calendar', directions: 'Get directions',
    countdown: 'Countdown', days: 'days', hours: 'hours', minutes: 'minutes', seconds: 'seconds', eventPassed: 'The event has started',
  },
  si: {
    language: 'භාෂාව', youAreInvited: 'ඔබට ආරාධනා', rsvpQuestion: 'ඔබ සහභාගී වෙනවාද?', attending: 'සහභාගී වෙමි',
    notAttending: 'සහභාගී නොවෙමි', maybe: 'තවම තීරණය කර නැත', partySize: 'සහභාගී වන ගණන', message: 'පණිවිඩය (විකල්ප)',
    name: 'ඔබේ නම', phone: 'දුරකථන අංකය (විකල්ප)', sendRsvp: 'පිළිතුර යවන්න', updateRsvp: 'පිළිතුර යාවත්කාලීන කරන්න', saving: 'සුරකිමින්…',
    thankYou: 'ස්තුතියි', responseSaved: 'ඔබේ පිළිතුර සුරක්ෂිතයි', changeAnswer: 'පිළිතුර වෙනස් කරන්න', cancel: 'අවලංගු කරන්න',
    closed: 'පිළිතුරු කාලය අවසන්', closedDescription: 'පිළිතුරු භාරගන්නා අවසන් දිනය පසු වී ඇත.', existingAnswer: 'ඔබේ පෙර පිළිතුර',
    noAnswer: 'අවසන් දිනයට පෙර ඔබ පිළිතුරක් එවා නැත.', addCalendar: 'දින දර්ශනයට එක් කරන්න', directions: 'ගමන් මඟ ලබාගන්න',
    countdown: 'උත්සවයට ඉතිරි කාලය', days: 'දින', hours: 'පැය', minutes: 'මිනිත්තු', seconds: 'තත්පර', eventPassed: 'උත්සවය ආරම්භ වී ඇත',
  },
  ta: {
    language: 'மொழி', youAreInvited: 'உங்களுக்கு அழைப்பு', rsvpQuestion: 'நீங்கள் கலந்து கொள்வீர்களா?', attending: 'கலந்து கொள்கிறேன்',
    notAttending: 'கலந்து கொள்ள முடியாது', maybe: 'இன்னும் முடிவு செய்யவில்லை', partySize: 'வருவோர் எண்ணிக்கை', message: 'செய்தி (விருப்பம்)',
    name: 'உங்கள் பெயர்', phone: 'தொலைபேசி (விருப்பம்)', sendRsvp: 'பதிலை அனுப்பு', updateRsvp: 'என் பதிலைப் புதுப்பி', saving: 'சேமிக்கிறது…',
    thankYou: 'நன்றி', responseSaved: 'உங்கள் பதில் சேமிக்கப்பட்டது', changeAnswer: 'என் பதிலை மாற்று', cancel: 'ரத்து செய்',
    closed: 'பதில் அளிக்கும் காலம் முடிந்தது', closedDescription: 'பதில் அளிக்கும் கடைசி நாள் கடந்துவிட்டது.', existingAnswer: 'உங்கள் முந்தைய பதில்',
    noAnswer: 'கடைசி நாளுக்கு முன் நீங்கள் பதில் அளிக்கவில்லை.', addCalendar: 'நாட்காட்டியில் சேர்', directions: 'வழியைப் பெறு',
    countdown: 'நிகழ்வுக்கான மீதமுள்ள நேரம்', days: 'நாட்கள்', hours: 'மணி', minutes: 'நிமிடங்கள்', seconds: 'விநாடிகள்', eventPassed: 'நிகழ்வு தொடங்கிவிட்டது',
  },
} as const;
