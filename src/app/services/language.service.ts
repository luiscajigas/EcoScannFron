import { Injectable, signal } from '@angular/core';

const CLAVE_IDIOMA = 'ecoscan_idioma';

const es = {
  languageName: 'Español',
  switchLanguage: 'Cambiar idioma a English',
  themeLight: 'Modo claro',
  themeDark: 'Modo oscuro',
  themeLightAria: 'Cambiar a modo claro',
  themeDarkAria: 'Cambiar a modo oscuro',
  brandTagline: 'Pequeñas acciones, gran impacto',
  loginEyebrow: 'Reciclar se siente bien',
  loginHeadline: 'Un pequeño gesto cambia mucho.',
  loginIntro: 'Identifica tus residuos, descubre cómo separarlos y celebra cada paso hacia un planeta más limpio.',
  loginStepScan: 'Escanea lo que vas a reciclar',
  loginStepLearn: 'Aprende a separar mejor',
  loginStepPoints: 'Suma puntos por tus acciones',
  loginWelcome: 'Qué bueno verte de nuevo',
  loginTitle: 'Inicia sesión',
  loginSubtitle: 'Continúa con tus hábitos sostenibles.',
  email: 'Correo',
  emailPlaceholder: 'tucorreo@ejemplo.com',
  password: 'Contraseña',
  loginLoading: 'Ingresando...',
  loginButton: 'Entrar a mi cuenta',
  noAccount: '¿Todavía no tienes cuenta?',
  createHere: 'Crea una aquí',
  loginError: 'No se pudo iniciar sesión.',
  loginInvalid: 'Credenciales inválidas.',
  registerEyebrow: 'Un planeta, muchas acciones',
  registerHeadline: 'Haz que cada residuo cuente.',
  registerIntro: 'Únete a una comunidad que convierte el reciclaje de todos los días en un hábito sencillo y positivo.',
  registerStepAccount: 'Crea tu cuenta en un momento',
  registerStepScan: 'Clasifica tus residuos con una foto',
  registerStepLearn: 'Aprende y suma puntos',
  registerToday: 'Empieza hoy',
  registerTitle: 'Crea tu cuenta',
  registerSubtitle: 'Un pequeño paso para ti, un mejor hábito para el planeta.',
  name: 'Nombre',
  namePlaceholder: 'Tu nombre',
  registerLoading: 'Creando cuenta...',
  registerButton: 'Crear mi cuenta',
  hasAccount: '¿Ya tienes cuenta?',
  signIn: 'Inicia sesión',
  registerError: 'No se pudo completar el registro.',
  emailExists: 'Ya existe una cuenta con ese correo.',
  dashboardTagline: 'Pequeñas acciones, gran impacto',
  changeTheme: 'Cambiar tema',
  greeting: 'Hola,',
  signOut: 'Cerrar sesión',
  dashboardEyebrow: 'Tu espacio sostenible',
  dashboardHeadline: 'Cada residuo cuenta.',
  dashboardIntro: 'Toma una foto, descubre dónde va y convierte tus buenos hábitos en puntos.',
  yourPoints: 'Tus puntos',
  scanTitle: 'Escanea un residuo',
  betaClassification: '♻ Clasificación beta',
  chooseAnotherPhoto: 'Elegir otra foto del residuo',
  takeOrUploadPhoto: 'Tomar o subir una foto del residuo',
  analyzePhoto: 'Analizando foto…',
  chooseAnother: 'Toca para elegir otra foto',
  photoTip: 'Procura que el residuo se vea con claridad',
  firstScan: 'Tu próximo escaneo empieza aquí',
  takeOrChoose: 'Toca para tomar una foto o elegirla de tu galería',
  processing: 'Estamos preparando tu clasificación…',
  workerError: 'Tu navegador no soporta Web Workers.',
  imageError: 'No se pudo procesar la imagen:',
  saveScanError: 'No se pudo registrar el escaneo.',
  photoEyebrow: 'Una buena foto ayuda',
  threeSteps: '3 pasos sencillos',
  photoIntro: 'Sigue estas recomendaciones para obtener el mejor resultado.',
  stepOneTitle: 'Enfoca un solo residuo',
  stepOneText: 'Evita poner varios objetos juntos.',
  stepTwoTitle: 'Busca buena iluminación',
  stepTwoText: 'La luz natural permite ver mejor los detalles.',
  stepThreeTitle: 'Revisa dónde depositarlo',
  stepThreeText: 'Te mostraremos la categoría y el contenedor recomendado.',
  photoBackgroundTip: 'Coloca el objeto sobre un fondo simple para que destaque.',
  resultEyebrow: 'Resultado de tu escaneo',
  goodJob: '¡Buen trabajo!',
  container: 'Contenedor',
  totalScore: 'Puntaje total:',
  activity: 'Tu actividad',
  scanOne: 'escaneo',
  scanMany: 'escaneos',
  loadingHistory: 'Cargando tu historial…',
  noScans: 'Aún no hay escaneos. ¡El primero puede ser hoy!',
  scanLoadError: 'No se pudo cargar tu historial.',
  categoryOrganic: 'Orgánico / compostable',
  categoryOrganicInstructions: 'Va en el contenedor verde. Restos de comida, cáscaras, residuos de jardín.',
  categoryPaper: 'Papel y cartón',
  categoryPaperInstructions: 'Va en el contenedor azul. Dobla las cajas de cartón antes de desecharlas.',
  categoryPlastic: 'Plástico',
  categoryPlasticInstructions: 'Va en el contenedor blanco/gris de reciclables. Enjuaga el envase si tuvo comida.',
  categoryGlass: 'Vidrio',
  categoryGlassInstructions: 'Va en el contenedor de reciclables, idealmente separado para evitar roturas.',
  categoryMetal: 'Metal',
  categoryMetalInstructions: 'Va en el contenedor de reciclables. Latas y tapas metálicas, de ser posible aplastadas.',
  categoryOther: 'No reciclable',
  categoryOtherInstructions: 'Va en el contenedor negro (basura ordinaria). Ej: empaques mixtos, icopor, papel higiénico.',
  iaNotice: 'Esta clasificación es una heurística simple por color dominante. La clasificación real por IA de visión se conectará en la siguiente fase.',
  apiRequiredFields: 'nombre, email y password son obligatorios.',
  apiRequiredEmailPassword: 'email y password son obligatorios.',
  apiAccountExists: 'Ya existe una cuenta con ese correo.',
  apiInvalidCredentials: 'Credenciales inválidas.',
  apiCategoryUnknown: 'Categoría no reconocida.',
  apiLoginFailure: 'Error al iniciar sesión.',
  apiRegistrationFailure: 'Error al registrar el usuario.',
  apiCategoriesFailure: 'Error al consultar las categorías.',
  apiUserFailure: 'Error al consultar el usuario.',
  apiHistoryFailure: 'Error al consultar el historial.',
  apiCategoryFailure: 'Error al consultar la categoría.',
  apiScanFailure: 'Error al guardar el escaneo.',
  apiMissingToken: 'No autenticado. Falta el token.',
  apiInvalidToken: 'Token inválido o expirado.',
  containerGreen: 'verde',
  containerBlue: 'azul',
  containerWhite: 'blanco',
  containerBlack: 'negro'
} as const;

type TranslationKey = keyof typeof es;
type WasteCategory = 'organico' | 'papel_carton' | 'plastico' | 'vidrio' | 'metal' | 'no_reciclable';

const en: Record<TranslationKey, string> = {
  languageName: 'English',
  switchLanguage: 'Cambiar idioma a Español',
  themeLight: 'Light mode',
  themeDark: 'Dark mode',
  themeLightAria: 'Switch to light mode',
  themeDarkAria: 'Switch to dark mode',
  brandTagline: 'Small actions, big impact',
  loginEyebrow: 'Feel good about recycling',
  loginHeadline: 'One small action can make a big difference.',
  loginIntro: 'Identify your waste, learn how to sort it, and celebrate every step toward a cleaner planet.',
  loginStepScan: 'Scan an item you want to recycle',
  loginStepLearn: 'Learn how to sort waste better',
  loginStepPoints: 'Earn points for your actions',
  loginWelcome: 'Welcome back',
  loginTitle: 'Sign in',
  loginSubtitle: 'Keep up your sustainable habits.',
  email: 'Email',
  emailPlaceholder: 'you@example.com',
  password: 'Password',
  loginLoading: 'Signing in...',
  loginButton: 'Sign in to your account',
  noAccount: "Don't have an account yet?",
  createHere: 'Create one here',
  loginError: 'Could not sign in.',
  loginInvalid: 'Invalid email or password.',
  registerEyebrow: 'One planet, many actions',
  registerHeadline: 'Make every piece of waste count.',
  registerIntro: 'Join a community turning everyday recycling into a simple, positive habit.',
  registerStepAccount: 'Create your account in a moment',
  registerStepScan: 'Sort your waste with a photo',
  registerStepLearn: 'Learn and earn points',
  registerToday: 'Get started today',
  registerTitle: 'Create your account',
  registerSubtitle: 'One small step for you, a better habit for the planet.',
  name: 'Name',
  namePlaceholder: 'Your name',
  registerLoading: 'Creating account...',
  registerButton: 'Create my account',
  hasAccount: 'Already have an account?',
  signIn: 'Sign in',
  registerError: 'Could not complete registration.',
  emailExists: 'An account with this email already exists.',
  dashboardTagline: 'Small actions, big impact',
  changeTheme: 'Change theme',
  greeting: 'Hi,',
  signOut: 'Sign out',
  dashboardEyebrow: 'Your sustainable space',
  dashboardHeadline: 'Every item counts.',
  dashboardIntro: 'Take a photo, find out where it goes, and turn good habits into points.',
  yourPoints: 'Your points',
  scanTitle: 'Scan an item',
  betaClassification: '♻ Beta classification',
  chooseAnotherPhoto: 'Choose another photo of the item',
  takeOrUploadPhoto: 'Take or upload a photo of an item',
  analyzePhoto: 'Analyzing photo…',
  chooseAnother: 'Tap to choose another photo',
  photoTip: 'Make sure the item is clearly visible',
  firstScan: 'Your next scan starts here',
  takeOrChoose: 'Tap to take a photo or choose one from your gallery',
  processing: 'Preparing your classification…',
  workerError: 'Your browser does not support Web Workers.',
  imageError: 'Could not process the image:',
  saveScanError: 'Could not save the scan.',
  photoEyebrow: 'A good photo makes a difference',
  threeSteps: '3 easy steps',
  photoIntro: 'Follow these tips for the best results.',
  stepOneTitle: 'Focus on one item',
  stepOneText: 'Avoid placing several items together.',
  stepTwoTitle: 'Find good lighting',
  stepTwoText: 'Natural light makes details easier to see.',
  stepThreeTitle: 'Check where it belongs',
  stepThreeText: 'We will show you the category and the recommended bin.',
  photoBackgroundTip: 'Place the item against a simple background so it stands out.',
  resultEyebrow: 'Your scan result',
  goodJob: 'Nice work!',
  container: 'Bin',
  totalScore: 'Total score:',
  activity: 'Your activity',
  scanOne: 'scan',
  scanMany: 'scans',
  loadingHistory: 'Loading your history…',
  noScans: 'No scans yet. Your first one can be today!',
  scanLoadError: 'Could not load your history.',
  categoryOrganic: 'Organic / compostable',
  categoryOrganicInstructions: 'Put it in the green bin. Food scraps, peels, and garden waste.',
  categoryPaper: 'Paper and cardboard',
  categoryPaperInstructions: 'Put it in the blue bin. Flatten cardboard boxes before disposal.',
  categoryPlastic: 'Plastic',
  categoryPlasticInstructions: 'Put it in the white/gray recycling bin. Rinse food containers.',
  categoryGlass: 'Glass',
  categoryGlassInstructions: 'Put it in the recycling bin, preferably separated to prevent breakage.',
  categoryMetal: 'Metal',
  categoryMetalInstructions: 'Put it in the recycling bin. Flatten cans and metal lids if possible.',
  categoryOther: 'Non-recyclable',
  categoryOtherInstructions: 'Put it in the black bin (general waste), e.g. mixed packaging, foam, or tissues.',
  iaNotice: 'This classification uses a simple dominant-color heuristic. Real vision-based AI classification will be added in a later phase.',
  apiRequiredFields: 'Name, email, and password are required.',
  apiRequiredEmailPassword: 'Email and password are required.',
  apiAccountExists: 'An account with this email already exists.',
  apiInvalidCredentials: 'Invalid email or password.',
  apiCategoryUnknown: 'Unrecognized category.',
  apiLoginFailure: 'Could not sign in.',
  apiRegistrationFailure: 'Could not register the user.',
  apiCategoriesFailure: 'Could not load categories.',
  apiUserFailure: 'Could not load the user profile.',
  apiHistoryFailure: 'Could not load scan history.',
  apiCategoryFailure: 'Could not load the category.',
  apiScanFailure: 'Could not save the scan.',
  apiMissingToken: 'You are not signed in. The access token is missing.',
  apiInvalidToken: 'Your session is invalid or has expired.',
  containerGreen: 'green',
  containerBlue: 'blue',
  containerWhite: 'white',
  containerBlack: 'black'
};

const categories: Record<WasteCategory, { name: TranslationKey; instructions: TranslationKey }> = {
  organico: { name: 'categoryOrganic', instructions: 'categoryOrganicInstructions' },
  papel_carton: { name: 'categoryPaper', instructions: 'categoryPaperInstructions' },
  plastico: { name: 'categoryPlastic', instructions: 'categoryPlasticInstructions' },
  vidrio: { name: 'categoryGlass', instructions: 'categoryGlassInstructions' },
  metal: { name: 'categoryMetal', instructions: 'categoryMetalInstructions' },
  no_reciclable: { name: 'categoryOther', instructions: 'categoryOtherInstructions' }
};

const apiErrors: Record<string, TranslationKey> = {
  'nombre, email y password son obligatorios.': 'apiRequiredFields',
  'email y password son obligatorios.': 'apiRequiredEmailPassword',
  'Ya existe una cuenta con ese correo.': 'apiAccountExists',
  'Credenciales inválidas.': 'apiInvalidCredentials',
  'Categoría no reconocida.': 'apiCategoryUnknown',
  'Error al iniciar sesión.': 'apiLoginFailure',
  'Error al registrar el usuario.': 'apiRegistrationFailure',
  'Error al consultar las categorías.': 'apiCategoriesFailure',
  'Error al consultar el usuario.': 'apiUserFailure',
  'Error al consultar el historial.': 'apiHistoryFailure',
  'Error al consultar la categoría.': 'apiCategoryFailure',
  'Error al guardar el escaneo.': 'apiScanFailure',
  'No autenticado. Falta el token.': 'apiMissingToken',
  'Token inválido o expirado.': 'apiInvalidToken'
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<'es' | 'en'>('es');

  constructor() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(CLAVE_IDIOMA) === 'en') {
      this.language.set('en');
    }
    this.applyLanguage();
  }

  t(key: TranslationKey): string {
    return this.language() === 'en' ? en[key] : es[key];
  }

  toggle(): void {
    this.language.update((language) => language === 'es' ? 'en' : 'es');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLAVE_IDIOMA, this.language());
    }
    this.applyLanguage();
  }

  categoryName(key: string, fallback: string): string {
    const category = categories[key as WasteCategory];
    return category ? this.t(category.name) : fallback;
  }

  categoryInstructions(key: string, fallback: string): string {
    const category = categories[key as WasteCategory];
    return category ? this.t(category.instructions) : fallback;
  }

  containerName(color: string): string {
    const key: Record<string, TranslationKey> = {
      verde: 'containerGreen',
      azul: 'containerBlue',
      blanco: 'containerWhite',
      negro: 'containerBlack'
    };
    return key[color] ? this.t(key[color]) : color;
  }

  apiError(message: unknown, fallback: TranslationKey): string {
    if (this.language() === 'en' && typeof message === 'string' && apiErrors[message]) {
      return this.t(apiErrors[message]);
    }
    return typeof message === 'string' && message ? message : this.t(fallback);
  }

  private applyLanguage(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.language() === 'en' ? 'en' : 'es';
    }
  }
}
