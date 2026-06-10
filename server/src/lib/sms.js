export function buildJobMessage(laborer, event, requirement) {
  const installSrc = requirement?.installDates
    ? JSON.parse(requirement.installDates)
    : [];
  const dismantleSrc = requirement?.dismantleDates
    ? JSON.parse(requirement.dismantleDates)
    : [];

  const install = installSrc.length
    ? installSrc.map((d) => `${d.date} @ ${d.time}`).join('\n')
    : 'TBD';
  const dismantle = dismantleSrc.length
    ? dismantleSrc.map((d) => `${d.date} @ ${d.time}`).join('\n')
    : 'TBD';

  const firstName = laborer.name.split(' ')[0];

  const role = requirement?.laborType || laborer.jobType;
  return `Good morning ${firstName}. I want to put this on your radar for ${role} position for a show at ${event.venue}:

Show name: ${event.name}
Venue: ${event.venue}${event.exhibitor ? `\nExhibitor: ${event.exhibitor}` : ''}${event.booth ? `\nBooth: ${event.booth}` : ''}

INSTALL:
${install}

DISMANTLE:
${dismantle}

You have 12 hours to accept this job. Reply YES to accept or NO to decline.`;
}

export async function sendSms(to, body) {
  if (!process.env.VONAGE_API_KEY) {
    console.log(`[SMS MOCK] To: ${to}\n${body}\n`);
    return { messageId: 'mock-' + Date.now() };
  }

  const params = new URLSearchParams({
    api_key: process.env.VONAGE_API_KEY,
    api_secret: process.env.VONAGE_API_SECRET,
    to: to.replace('+', ''),
    from: process.env.VONAGE_PHONE_NUMBER,
    text: body,
  });

  const res = await fetch(`https://rest.nexmo.com/sms/json?${params}`);
  const data = await res.json();
  const msg = data.messages[0];

  if (msg.status !== '0') {
    throw new Error(`Vonage error ${msg.status}: ${msg['error-text']}`);
  }

  return msg;
}
