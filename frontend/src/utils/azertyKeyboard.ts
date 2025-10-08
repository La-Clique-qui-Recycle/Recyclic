/**
 * Utilitaire pour la gestion du clavier AZERTY étendu
 * Normalise les touches AZERTY vers les chiffres avec support Shift/AltGr
 */

// Mapping des touches AZERTY vers les chiffres
const AZERTY_KEY_MAP: Record<string, string> = {
  '&': '1',
  'é': '2', 
  '"': '3',
  "'": '4',
  '(': '5',
  '-': '6',
  'è': '7',
  '_': '8',
  'ç': '9',
  'à': '0'
};

// Mapping pour les touches avec Shift/AltGr
const AZERTY_SHIFT_MAP: Record<string, string> = {
  '1': '1', // Shift+& = 1
  '2': '2', // Shift+é = 2
  '3': '3', // Shift+" = 3
  '4': '4', // Shift+' = 4
  '5': '5', // Shift+( = 5
  '6': '6', // Shift+- = 6
  '7': '7', // Shift+è = 7
  '8': '8', // Shift+_ = 8
  '9': '9', // Shift+ç = 9
  '0': '0', // Shift+à = 0
};

/**
 * Vérifie si une touche est un chiffre direct
 */
export function isDirectNumeric(key: string): boolean {
  return /^[0-9]$/.test(key);
}

/**
 * Vérifie si une touche est une touche AZERTY mappée
 */
export function isAZERTYMapped(key: string): boolean {
  return key in AZERTY_KEY_MAP;
}

/**
 * Vérifie si une touche est une combinaison Shift+AZERTY
 */
export function isAZERTYShiftMapped(key: string, event: KeyboardEvent): boolean {
  return event.shiftKey && key in AZERTY_SHIFT_MAP;
}

/**
 * Convertit une touche AZERTY en chiffre
 */
export function mapAZERTYToNumeric(key: string, event?: KeyboardEvent): string | null {
  // Touches de modification - ignorer
  if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') {
    return null;
  }
  
  // Chiffres directs
  if (isDirectNumeric(key)) {
    return key;
  }
  
  // Mapping AZERTY direct
  if (isAZERTYMapped(key)) {
    return AZERTY_KEY_MAP[key];
  }
  
  // Mapping Shift+AZERTY
  if (event && isAZERTYShiftMapped(key, event)) {
    return AZERTY_SHIFT_MAP[key];
  }
  
  return null;
}

/**
 * Vérifie si une touche est une touche spéciale (Backspace, Delete, point décimal)
 */
export function isSpecialKey(key: string): boolean {
  return ['Backspace', 'Delete', '.', ','].includes(key);
}

/**
 * Gère l'entrée clavier AZERTY pour les champs numériques
 * @param currentInput Valeur actuelle du champ
 * @param key Touche pressée
 * @param event Event clavier complet
 * @param maxLength Longueur maximale autorisée
 * @param allowDecimal Autoriser les décimales
 * @returns Nouvelle valeur du champ
 */
export function handleAZERTYInput(
  currentInput: string, 
  key: string, 
  event: KeyboardEvent,
  maxLength: number = 10,
  allowDecimal: boolean = true
): string {
  // Ignorer les touches de modification
  if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') {
    return currentInput;
  }
  
  // Gérer les touches spéciales
  if (key === 'Backspace' || key === 'Delete') {
    return currentInput.slice(0, -1);
  }
  
  if ((key === '.' || key === ',') && allowDecimal) {
    return currentInput.includes('.') ? currentInput : currentInput + '.';
  }
  
  // Convertir la touche en chiffre
  const numericValue = mapAZERTYToNumeric(key, event);
  
  if (numericValue === null) {
    return currentInput; // Ignorer la touche
  }
  
  // Vérifier la longueur maximale
  if (currentInput.length >= maxLength) {
    return currentInput;
  }
  
  // Ajouter le chiffre
  return currentInput + numericValue;
}

/**
 * Crée un gestionnaire d'événement clavier pour les champs numériques
 * @param setValue Fonction pour mettre à jour la valeur
 * @param validate Fonction de validation (optionnelle)
 * @param maxLength Longueur maximale (défaut: 10)
 * @param allowDecimal Autoriser les décimales (défaut: true)
 * @returns Gestionnaire d'événement
 */
export function createAZERTYHandler(
  setValue: (value: string) => void,
  validate?: (value: string) => void,
  maxLength: number = 10,
  allowDecimal: boolean = true
) {
  return (event: KeyboardEvent) => {
    // Ignorer si on est dans un input ou textarea
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const key = event.key;
    const currentInput = (event.target as any)?.value || '';
    
    const newValue = handleAZERTYInput(currentInput, key, event, maxLength, allowDecimal);
    
    if (newValue !== currentInput) {
      event.preventDefault();
      setValue(newValue);
      if (validate) {
        validate(newValue);
      }
    }
  };
}
