export function getCurrentPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada pelo navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new Error(
              'Permissão de localização negada. Habilite a localização no seu navegador para responder a chamada.',
            ),
          );
        } else {
          reject(new Error('Não foi possível obter sua localização'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
