// Endpoint simplificado para pruebas
// Para implementar:
// 1. Copia este código al final de startServer() en index.js
// 2. Justo antes de app.listen(PORT, ...)

app.post("/test-book-slot", (req, res) => {
  console.log("📥 Petición recibida en /test-book-slot:");
  console.log(req.body); // Verás el contenido del evento

  // Solo para test, responde algo simple
  res.status(200).json({ 
    message: "Reserva recibida correctamente",
    success: true,
    received_data: req.body
  });
});

// También puedes agregarlo directamente sin implementación de CORS
// si estás teniendo problemas:

/*
// Endpoint sin verificaciones ni dependencias
app.post("/test-book-simple", (req, res) => {
  console.log("📥 SIMPLE TEST - Petición recibida:");
  console.log(JSON.stringify(req.body, null, 2));
  
  res.header('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true });
});
*/ 