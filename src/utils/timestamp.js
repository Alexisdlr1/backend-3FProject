function getDateForPYT(inputDate) {
    // Si el input es un string, lo convertimos a objeto Date
    const date = inputDate instanceof Date ? inputDate : new Date(inputDate);

    // Verificamos si la fecha es válida
    if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
    }

    // Creamos una nueva fecha para no modificar la original
    const resultDate = new Date(date);

    // Añadimos 3 meses
    resultDate.setMonth(date.getMonth() + 3);

    // Obtenemos el día del mes de la fecha original
    const dayOfMonth = date.getDate();

    // Aplicamos las reglas de negocio:
    if (dayOfMonth >= 1 && dayOfMonth <= 15) {
        // Si el día está entre 1 y 15, ajustamos al día 15 del mes resultante
        resultDate.setDate(15);
    } else {
        // Si el día está entre 16 y fin de mes, ajustamos al primer día del mes siguiente
        resultDate.setMonth(resultDate.getMonth() + 1);
        resultDate.setDate(1);
    }

    return resultDate;
}

function getDateForCommission(inputDate) {
    // Si el input es un string, lo convertimos a objeto Date
    const date = inputDate instanceof Date ? inputDate : new Date(inputDate);

    // Verificamos si la fecha es válida
    if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
    }

    // Creamos una nueva fecha para no modificar la original
    const resultDate = new Date(date);

    resultDate.setMonth(date.getMonth() + 1);

    return resultDate;
}

module.exports = { getDateForPYT, getDateForCommission };
