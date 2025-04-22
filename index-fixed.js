// Reemplaza las siguientes líneas en tu archivo index.js:

// En el endpoint /cors-test:
endpoints: {
  availableSlots: {
    GET: `${req.protocol}://${req.get('host')}/available-slots?date=YYYY-MM-DD`,
    POST: `${req.protocol}://${req.get('host')}/available-slots (con body: {"date": "YYYY-MM-DD"})`,
    info: "Si no se proporciona fecha, se usará la fecha actual",
    response: ["09:00", "10:00", "11:00", "..."]  // Ahora es un array directo
  },
  bookSlot: {
    POST: `${req.protocol}://${req.get('host')}/book-slot`,
    body: {
      date: "YYYY-MM-DD",
      time: "HH:MM",
      name: "Nombre del cliente",
      email: "email@example.com",
      service: "Nombre del servicio"
    }
  }
}

// En la función para fechas predeterminadas:
// Formatear la fecha actual como YYYY-MM-DD
const today = new Date();
const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

// En los logs de book-slot:
console.error(`❌ El horario ${req.body.time} ya está reservado para la fecha ${req.body.date}`);
console.log(`📋 Horarios disponibles ANTES de la reserva para la fecha ${req.body.date}`);
console.error(`❌ El horario ${req.body.time} no está disponible en el calendario para la fecha ${req.body.date}`);
console.log(`📋 Horarios disponibles DESPUÉS de la reserva para la fecha ${req.body.date}`);
console.log(`🔍 El horario ${req.body.time} ${slotWasRemoved ? "fue eliminado correctamente ✅" : "NO fue eliminado ❌"}`);

// En app.listen:
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)); 