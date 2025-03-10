const axios = require('axios');

// Calcula ETA usando Google Distance Matrix API
async function calculateETA(origin, destination) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.rows[0]?.elements[0]?.duration) {
      return {
        text: response.data.rows[0].elements[0].duration.text,
        value: response.data.rows[0].elements[0].duration.value
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao calcular ETA:', error);
    return null;
  }
}

// Calcula preço dinâmico baseado em demanda
function calculateDynamicPrice(basePrice, demand) {
  const multiplier = 1 + (demand / 10); // Aumenta 10% para cada ponto de demanda
  return basePrice * multiplier;
}

// Calcula desvio de rota
async function calculateRouteDeviation(currentLocation, originalRoute) {
  try {
    // Usa a API do Google Maps para calcular o desvio
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${originalRoute.start.lat},${originalRoute.start.lng}&destination=${originalRoute.end.lat},${originalRoute.end.lng}&waypoints=${currentLocation.latitude},${currentLocation.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.routes[0]) {
      const originalDistance = originalRoute.distance;
      const newDistance = response.data.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
      return (newDistance - originalDistance) / originalDistance * 100; // % de desvio
    }
    return 0;
  } catch (error) {
    console.error('Erro ao calcular desvio de rota:', error);
    return 0;
  }
}

// Monitora eventos de velocidade
function checkSpeedEvent(currentSpeed, location) {
  const SPEED_LIMIT = 80; // km/h
  if (currentSpeed > SPEED_LIMIT) {
    return {
      timestamp: new Date(),
      speed: currentSpeed,
      location
    };
  }
  return null;
}

module.exports = {
  calculateETA,
  calculateDynamicPrice,
  calculateRouteDeviation,
  checkSpeedEvent
}; 