import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export function buildJobMessage(laborer, event) {
  const install = JSON.parse(event.installDates)
    .map((d) => `${d.date} @ ${d.time}`)
    .join('\n');
  const dismantle = JSON.parse(event.dismantleDates)
    .map((d) => `${d.date} @ ${d.time}`)
    .join('\n');

  const firstName = laborer.name.split(' ')[0];

  return `Good morning ${firstName}. I want to put this on your radar for ${laborer.jobType} position for a show at ${event.venue}:

Show name: ${event.name}
Venue: ${event.venue}${event.exhibitor ? `\nExhibitor: ${event.exhibitor}` : ''}${event.booth ? `\nBooth: ${event.booth}` : ''}

INSTALL:
${install}

DISMANTLE:
${dismantle}

Reply YES to accept or NO to decline.`;
}

export async function sendSms(to, body) {
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.startsWith('AC' + 'x')) {
    console.log(`[SMS MOCK] To: ${to}\n${body}\n`);
    return { sid: 'mock-' + Date.now() };
  }
  return client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}
