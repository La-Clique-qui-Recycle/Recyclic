/**
 * Utilitaire pour le calcul des montants de ligne
 * Gère les arrondis et les locales pour les calculs prix × quantité
 */

/**
 * Calcule le montant d'une ligne (prix × quantité)
 * @param price Prix unitaire (peut être un string ou number)
 * @param quantity Quantité (peut être un string ou number)
 * @returns Montant arrondi à 2 décimales
 */
export function computeLineAmount(price: string | number, quantity: string | number): number {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  const quantityNum = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
  
  // Validation des entrées
  if (isNaN(priceNum) || isNaN(quantityNum) || priceNum < 0 || quantityNum < 0) {
    return 0;
  }
  
  const amount = priceNum * quantityNum;
  
  // Arrondi à 2 décimales pour éviter les erreurs de précision flottante
  return Math.round(amount * 100) / 100;
}

/**
 * Formate un montant pour l'affichage avec les locales françaises
 * @param amount Montant à formater
 * @returns Montant formaté (ex: "15,50 €")
 */
export function formatLineAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calcule et formate le montant d'une ligne
 * @param price Prix unitaire
 * @param quantity Quantité
 * @returns Montant formaté pour l'affichage
 */
export function computeAndFormatLineAmount(price: string | number, quantity: string | number): string {
  const amount = computeLineAmount(price, quantity);
  return formatLineAmount(amount);
}
