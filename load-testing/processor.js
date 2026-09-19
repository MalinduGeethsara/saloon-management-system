let counter = 0;

// Real IDs pulled from the DB so the write test hits real foreign keys.
const SHOP_ID = '35bce4bc-1f89-4152-8312-309c8e7c6852';
const BARBER_ID = 'e87140e9-a384-487d-a915-75faf073c967';
const SERVICE_ID = '0e5d30da-d63e-4d69-a3b7-63152b23f7be';

// The shop is only open Tuesday/Wednesday 09:00-18:00 (Shop.operatingHours), so spread
// bookings across the next 12 open days x 8 hourly slots = 96 unique slots.
const OPEN_DAYS = [];
for (let i = 1; OPEN_DAYS.length < 12; i++) {
  const d = new Date();
  d.setDate(d.getDate() + i);
  if (d.getDay() === 2 || d.getDay() === 3) OPEN_DAYS.push(d);
}
const BASE = Math.floor(Math.random() * 96);

function setBookingSlot(context, events, done) {
  const idx = (BASE + counter++) % 96;
  const day = new Date(OPEN_DAYS[idx % 12]);
  day.setHours(9 + Math.floor(idx / 12), 0, 0, 0);

  context.vars.shopId = SHOP_ID;
  context.vars.barberId = BARBER_ID;
  context.vars.serviceId = SERVICE_ID;
  context.vars.bookingDate = day.toISOString();
  return done();
}

// The prod build sets the auth cookie with the `Secure` flag (NODE_ENV=production), which a
// spec-compliant cookie jar will not attach to plain http:// requests. Capture it manually
// from the login response and send it back as an explicit header instead.
function captureCookie(requestParams, response, context, ee, next) {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    const list = Array.isArray(setCookie) ? setCookie : [setCookie];
    const authTokenCookie = list.find((c) => c.startsWith('auth_token='));
    if (authTokenCookie) {
      context.vars.authCookie = authTokenCookie.split(';')[0];
    }
  }
  return next();
}

module.exports = { setBookingSlot, captureCookie };
