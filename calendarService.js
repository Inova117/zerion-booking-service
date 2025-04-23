import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import isBetween from 'dayjs/plugin/isBetween.js';

dayjs.extend(utc);
dayjs.extend(isBetween);

const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS = JSON.parse(fs.readFileSync('credentials.json'));
const TOKEN = JSON.parse(fs.readFileSync('token.json'));

const oAuth2Client = new google.auth.OAuth2(
  CREDENTIALS.installed?.client_id || CREDENTIALS.web.client_id,
  CREDENTIALS.installed?.client_secret || CREDENTIALS.web.client_secret,
  CREDENTIALS.installed?.redirect_uris[0] || CREDENTIALS.web.redirect_uris[0]
);

oAuth2Client.setCredentials(TOKEN);
const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

const WORK_START = 10;
const WORK_END = 19;
const SLOT_DURATION = 60; // en minutos
const CALENDAR_ID = '33999e2e0278c100c238793819f01221bdd267a9966f543a429602a21653b2a4@group.calendar.google.com';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function getAvailableSlots(dateStr) {
  const date = dayjs(`${dateStr}T00:00:00-05:00`).startOf('day');



  const start = date.hour(WORK_START).toISOString();
  const end = date.hour(WORK_END).toISOString();

  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: 'startTime'
  });

  const events = res.data.items;
  const busySlots = events.map(e => ({
    start: dayjs(e.start.dateTime),
    end: dayjs(e.end.dateTime)
  }));

  const slots = [];
  for (let hour = WORK_START; hour < WORK_END; hour++) {
    const slotStart = date.hour(hour);
    const slotEnd = slotStart.add(SLOT_DURATION, 'minute');

    const overlapping = busySlots.some(busy =>
      slotStart.isBefore(busy.end) && slotEnd.isAfter(busy.start)
    );

    if (!overlapping) {
      slots.push(slotStart.format('HH:mm'));
    }
  }

  return slots;
}

export async function bookSlot({ name, email, date, time, service }) {
  // La zona horaria específica que queremos usar
  const timezone = 'America/Guayaquil';
  
  console.log(`📅 bookSlot recibió: fecha=${date}, hora=${time}, nombre=${name}, email=${email}`);
  
  // Construir objetos de fecha como strings con formato ISO para evitar conversiones automáticas
  const startTimeISO = `${date}T${time}:00`;
  const [hours, minutes] = time.split(':').map(Number);
  
  // Calculamos la hora de fin (30 minutos después) manteniendo el formato de hora
  const endHours = hours + Math.floor((minutes + 30) / 60);
  const endMinutes = (minutes + 30) % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  const endTimeISO = `${date}T${endTime}:00`;
  
  console.log(`⏰ Horarios calculados: inicio=${startTimeISO}, fin=${endTimeISO}`);
  
  // Crear el evento explícitamente con la hora exacta solicitada
  const event = {
    summary: `Reserva de ${name}`,
    description: `Servicio solicitado: ${service || "No especificado"}`,
    start: {
      dateTime: startTimeISO,
      timeZone: timezone,
    },
    end: {
      dateTime: endTimeISO,
      timeZone: timezone,
    },
    attendees: [{ email }]
  };
  
  console.log(`📤 Enviando evento a Google Calendar:`, JSON.stringify(event, null, 2));
  
  // Enviar a Google Calendar
  const response = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: event
  });
  
  console.log(`✅ Respuesta de Google Calendar:`, response.data.htmlLink);

  // Registrar en Google Sheets
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'A1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[
        '', // Empresa
        name,
        '', // Teléfono
        email,
        '', // Sector
        '', // Ciudad
        dayjs().format('YYYY-MM-DD HH:mm'),
        'Agendado',
        date,
        time, // Agregamos la hora explícitamente
        '', '', '',
        `Solicitó: ${service || "No especificado"}`
      ]]
    }
  });

  return {
    status: 'confirmed',
    event_link: response.data.htmlLink
  };
}
