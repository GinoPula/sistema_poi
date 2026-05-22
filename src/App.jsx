import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ListChecks, ClipboardEdit, FileText, Plus, Trash2,
  Save, X, TrendingUp, Wallet, Target, AlertCircle, CheckCircle2,
  Calendar, Briefcase, Loader2, Edit3, Building2, Filter, Download,
  CalendarClock, MailOpen, Lock, Unlock, Send, Check, Clock, XCircle,
  User, LogOut, Shield, Eye, EyeOff, RefreshCw, FileSpreadsheet, Printer,
  Bell, History, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ComposedChart, Area, Cell,
  PieChart, Pie, LabelList
} from 'recharts';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const MESES_ABR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Años disponibles para programación: desde 2026 hasta 2100 (sistema de uso multianual)
const ANIO_INICIAL = 2026;
const ANIO_FINAL = 2100;
const ANIOS_DISPONIBLES = Array.from({ length: ANIO_FINAL - ANIO_INICIAL + 1 }, (_, i) => ANIO_INICIAL + i);

const CENTROS_COSTO = [
  { codigo: '03.07', nombre: 'GESTIÓN PNC', desc: 'Conducción y gestión administrativa, financiera y operativa del PNC', pia: 2094363,
    resumen: 'El Centro de Costos de la Gestión y Administración del Programa Nuestras Ciudades, bajo el ámbito del Viceministerio de Vivienda y Urbanismo del MVCS, es el órgano encargado de la dirección y coordinación integral de todas las actividades del programa. Su función principal es asegurar la planificación, ejecución, monitoreo y evaluación eficiente de los proyectos de inversión pública en infraestructura urbana a nivel nacional, así como promover el crecimiento, conservación, mejoramiento, protección e integración de nuestras ciudades.' },
  { codigo: '03.07.06', nombre: 'UGEDEUS', desc: 'Unidad de Gestión del Desarrollo Urbano Sostenible', pia: 817160,
    resumen: 'El Programa Nuestras Ciudades, a través de la Unidad de Gestión del Desarrollo Urbano Sostenible (UGEDEUS), desarrolla estudios, investigaciones y planes en materias de desarrollo urbano sostenible, acondicionamiento territorial y gestión ambiental. Asimismo brinda asistencia técnica y capacitación en dichas materias, y promueve la gestión del desarrollo urbano sostenible. La UGEDEUS también brinda asistencia técnica a los gobiernos locales en la implementación de Sistemas de Información Geográfica (SIG).' },
  { codigo: '03.07.07', nombre: 'UGERDES', desc: 'Unidad de Gestión del Riesgo de Desastres', pia: 22144570,
    resumen: 'El Programa Nuestras Ciudades, a través de la Unidad de Gestión del Riesgo de Desastres (UGERDES), desarrolla acciones de estimación, prevención y reducción de riesgos de desastres en las ciudades del país, en el marco de las políticas nacionales y sectoriales, y de los instrumentos de Gestión del Riesgo de Desastres. Realiza asistencia técnica, capacitación, estudios para establecer el riesgo y fortalecimiento de capacidades de los gobiernos regionales y locales. El PNC-Maquinarias realiza trabajos de prevención, mitigación de riesgos y atención de emergencias mediante 19 Unidades Básicas Operativas (UBO) a nivel nacional.' },
  { codigo: '03.07.08', nombre: 'UNINDEUS', desc: 'Unidad de Inversiones para el Desarrollo Urbano Sostenible', pia: 0,
    resumen: 'La Unidad de Inversiones para el Desarrollo Urbano Sostenible (UNINDEUS) se encarga de la formulación, ejecución, supervisión y liquidación de los proyectos de inversión pública del programa, así como de la asistencia técnica a las unidades formuladoras y evaluadoras de los gobiernos locales y la promoción de inversiones público-privadas.' },
];

const fmtMoney = (n) => `S/ ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtMoneyShort = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return `S/ ${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `S/ ${(v / 1e3).toFixed(1)}K`;
  return `S/ ${v.toFixed(0)}`;
};
// Número entero con separador de miles (sin decimales): 1,234,567
const fmtEntero = (n) => (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
// Número con 2 decimales y separador de miles: 1,234,567.89
const fmtDecimal = (n) => (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Abreviado en millones enteros para gráficos de barras: 5M
const fmtMillonesEnteros = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return `${Math.round(v / 1e6)}M`;
  if (Math.abs(v) >= 1e3) return `${Math.round(v / 1e3)}K`;
  return `${Math.round(v)}`;
};
const fmtPct = (n) => `${(Number(n) || 0).toFixed(1)}%`;
const uid = () => Math.random().toString(36).slice(2, 10);

// Renderer de etiqueta de % sobre las barras. Recharts pasa {x, y, width, value}.
// value es el string del campo indicado en dataKey (ej "87%" o "").
function PctBarLabel(props) {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 4}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fill="#1E2A3A">
      {value}
    </text>
  );
}


// Genéricas de gasto del clasificador presupuestal MEF
const GENERICAS_GASTO = [
  { codigo: '2.1', nombre: 'PERSONAL Y OBLIGACIONES SOCIALES' },
  { codigo: '2.3', nombre: 'BIENES Y SERVICIOS' },
  { codigo: '2.5', nombre: 'OTROS GASTOS' },
  { codigo: '2.6', nombre: 'ADQUISICIÓN DE ACTIVOS NO FINANCIEROS' },
];

// Crea una estructura vacía de genéricas con 12 meses cada una (PIA y PIM)
function nuevasGenericas() {
  const g = {};
  GENERICAS_GASTO.forEach(gen => {
    g[gen.codigo] = {
      pia: Array.from({ length: 12 }, () => 0),
      pim: Array.from({ length: 12 }, () => 0),
    };
  });
  return g;
}

// Crea estructura vacía de física mensual PIA y PIM (12 meses cada una)
function nuevaFisicaMensual() {
  return {
    pia: Array.from({ length: 12 }, () => 0),
    pim: Array.from({ length: 12 }, () => 0),
  };
}

// Suma anual de la física mensual por tipo (pia|pim), opcionalmente hasta cierto mes
function totalFisicaActividad(a, tipo, hastaMes = 12) {
  const arr = a.fisicaMensual?.[tipo] || [];
  let total = 0;
  for (let i = 0; i < hastaMes && i < 12; i++) total += Number(arr[i]) || 0;
  return total;
}

// Migra una actividad antigua (programacion: [{fisica, financiera}]) al nuevo modelo de genéricas.
// Coloca el financiero antiguo en la genérica 2.3 BIENES Y SERVICIOS, con PIA = PIM inicialmente.
// También crea la física mensual PIA/PIM desde programacion[].fisica.
function migrarActividadGenericas(a) {
  let out = { ...a };
  // Migrar genéricas financieras
  if (!out.genericas || typeof out.genericas !== 'object') {
    const g = nuevasGenericas();
    if (Array.isArray(out.programacion)) {
      out.programacion.forEach((p, i) => {
        const fin = Number(p?.financiera) || 0;
        g['2.3'].pia[i] = fin;
        g['2.3'].pim[i] = fin;
      });
    }
    out.genericas = g;
  }
  // Migrar física mensual PIA/PIM
  if (!out.fisicaMensual || typeof out.fisicaMensual !== 'object') {
    const fm = nuevaFisicaMensual();
    if (Array.isArray(out.programacion)) {
      out.programacion.forEach((p, i) => {
        const fis = Number(p?.fisica) || 0;
        fm.pia[i] = fis;
        fm.pim[i] = fis;
      });
    }
    out.fisicaMensual = fm;
  }
  // Flag de bloqueo de PIA (default: bloqueado si ya tiene datos, abierto si es nueva)
  if (typeof out.piaBloqueado === 'undefined') {
    const tieneDatos = totalFinancieroActividad(out, 'pia') > 0 || totalFisicaActividad(out, 'pia') > 0;
    out.piaBloqueado = tieneDatos; // si ya tiene PIA cargado, queda bloqueado
  }
  return out;
}

// Suma total financiera de una actividad para un tipo (pia|pim), opcionalmente hasta cierto mes
function totalFinancieroActividad(a, tipo, hastaMes = 12) {
  if (!a.genericas) return 0;
  let total = 0;
  GENERICAS_GASTO.forEach(gen => {
    const arr = a.genericas[gen.codigo]?.[tipo] || [];
    for (let i = 0; i < hastaMes && i < 12; i++) total += Number(arr[i]) || 0;
  });
  return total;
}

// Suma financiera de un mes específico (índice 0-11) para un tipo
function financieroMesActividad(a, tipo, mesIdx) {
  if (!a.genericas) return 0;
  let total = 0;
  GENERICAS_GASTO.forEach(gen => {
    total += Number(a.genericas[gen.codigo]?.[tipo]?.[mesIdx]) || 0;
  });
  return total;
}

// Fecha actual del sistema (simulada para el prototipo)
const HOY = '2026-05-11';
const HORA_ACTUAL = '14:30'; // hora simulada en formato HH:mm
const AHORA = `${HOY}T${HORA_ACTUAL}`;

// Construye un timestamp comparable a partir de fecha y hora
function ts(fecha, hora) {
  if (!fecha) return null;
  return `${fecha}T${hora || '00:00'}`;
}

// Áreas dentro de cada Centro de Costo (sub-nivel jerárquico)
// Si un usuario tiene 'areas' definidas, solo accede a actividades de esas áreas dentro de su CC.
// Si no tiene areas (null), accede a todas las áreas del CC.
// NOTA: Esta es la configuración INICIAL. En tiempo de ejecución, el admin puede agregar/eliminar
// áreas y el cambio se persiste en window.storage. Ver hook useAreasPorCC.
const AREAS_POR_CC_INICIAL = {
  'GESTIÓN PNC': ['GESTIÓN'],
  'UGEDEUS': ['UGEDEUS'],
  'UGERDES': [
    'UGERDES',
    'PNC-MAQUINARIAS', // engloba EMERGENCIA-DESCOLMATACIÓN, EMERGENCIA-TRANSITABILIDAD, MAQUINARIAS PREVENCIÓN
  ],
  'UNINDEUS': ['UNINDEUS'],
};

// Compatibilidad: referencia mutable que se reemplaza dinámicamente desde el componente raíz
// para que cualquier código legado que aún lea AREAS_POR_CC obtenga las áreas actualizadas.
let AREAS_POR_CC = { ...AREAS_POR_CC_INICIAL };

// Mapeo de área lógica → áreas físicas en la programación
// Permite que un usuario con área "PNC-MAQUINARIAS" vea actividades de 3 áreas diferentes
const AREAS_AGRUPADAS = {
  'PNC-MAQUINARIAS': ['EMERGENCIA-DESCOLMATACIÓN', 'EMERGENCIA-TRANSITABILIDAD', 'MAQUINARIAS PREVENCIÓN'],
};

// Usuarios del sistema con correos institucionales reales.
// La contraseña sigue siendo el campo de validación en el prototipo.
// En la migración a Google Workspace, el campo 'email' será el identificador único (SSO).
const USUARIOS_DEMO = [
  // Administrador — Planeamiento y Presupuesto
  { id: 'admin', usuario: 'rmalaspina', password: 'admin2026', email: 'rmalaspina@vivienda.gob.pe',
    nombre: 'Planeamiento y Presupuesto', cargo: 'Administrador del Sistema',
    rol: 'admin', centroCosto: null, areas: null },

  // Responsables de Centro de Costo
  // Julian Ccanto: dual — administrador del sistema y responsable de GESTIÓN PNC
  { id: 'jccanto', usuario: 'jccanto', password: 'gestion2026', email: 'jccanto@vivienda.gob.pe',
    nombre: 'Julian Waldir Ccanto Laurente', cargo: 'Administrador / Responsable GESTIÓN PNC',
    rol: 'admin', centroCosto: 'GESTIÓN PNC', areas: null },

  { id: 'salvarado', usuario: 'salvarado', password: 'ugedeus2026', email: 'salvarado@vivienda.gob.pe',
    nombre: 'Salvador Ernesto Alvarado Tovar', cargo: 'Responsable UGEDEUS',
    rol: 'responsable_cc', centroCosto: 'UGEDEUS', areas: null },

  // UGERDES tiene 2 áreas con responsables separados
  { id: 'mayala', usuario: 'mayala', password: 'ugerdes2026', email: 'mayala@vivienda.gob.pe',
    nombre: 'Maximo Ayala Gutierrez', cargo: 'Responsable UGERDES',
    rol: 'responsable_cc', centroCosto: 'UGERDES', areas: ['UGERDES'] },

  // PNC-Maquinarias:
  // - David Edward Alcalde Poma: Coordinador Nacional de PNC-Maquinarias
  // - Juan Manuel Castro Soto: Coordinador de Monitoreo (responsable del registro de seguimiento POI)
  { id: 'dalcalde', usuario: 'dalcalde', password: 'pncmaq2026', email: 'dalcalde@vivienda.gob.pe',
    nombre: 'David Edward Alcalde Poma', cargo: 'Coordinador Nacional PNC-Maquinarias',
    rol: 'responsable_cc', centroCosto: 'UGERDES', areas: ['PNC-MAQUINARIAS'] },

  { id: 'jmcsInt', usuario: 'jmcsint', password: 'pncmaq2026', email: 'mvcs_pnc_jmcs@viviendaext.pe',
    nombre: 'Juan Manuel Castro Soto', cargo: 'Coordinador de Monitoreo PNC-Maquinarias',
    rol: 'responsable_cc', centroCosto: 'UGERDES', areas: ['PNC-MAQUINARIAS'] },

  { id: 'ljmoya', usuario: 'ljmoya', password: 'unindeus2026', email: 'ljmoya@vivienda.gob.pe',
    nombre: 'Leonardy Josmell Moya Sanizo', cargo: 'Responsable UNINDEUS',
    rol: 'responsable_cc', centroCosto: 'UNINDEUS', areas: null },

  // Director DGPP — solo lectura
  { id: 'jbarron', usuario: 'jbarron', password: 'directivo2026', email: 'jbarron@vivienda.gob.pe',
    nombre: 'Director DGPP', cargo: 'Director General',
    rol: 'lector', centroCosto: null, areas: null },
];

// Helpers de rol
const esAdmin = (u) => u?.rol === 'admin';
const esLector = (u) => u?.rol === 'lector';
const esResponsableCC = (u) => u?.rol === 'responsable_cc';
const puedeEditar = (u) => esAdmin(u) || esResponsableCC(u);
const puedeEditarCC = (u, cc) => esAdmin(u) || (esResponsableCC(u) && u.centroCosto === cc);
const ccsVisibles = (u) => {
  if (esAdmin(u) || esLector(u)) return CENTROS_COSTO.map(c => c.nombre);
  if (esResponsableCC(u)) return [u.centroCosto];
  return [];
};

// Expande las áreas lógicas del usuario a las áreas físicas que puede ver
// Ejemplo: si tiene area "PNC-MAQUINARIAS", devuelve los 3 nombres reales de las actividades
function expandirAreasUsuario(u) {
  if (!u || !u.areas || u.areas.length === 0) return null; // null = todas
  const expandidas = [];
  u.areas.forEach(a => {
    if (AREAS_AGRUPADAS[a]) {
      expandidas.push(...AREAS_AGRUPADAS[a]);
    } else {
      expandidas.push(a);
    }
  });
  return expandidas;
}

// Verifica si el usuario puede ver/editar una actividad específica
function puedeAccederActividad(u, actividad) {
  if (esAdmin(u) || esLector(u)) return true;
  if (!esResponsableCC(u)) return false;
  if (actividad.centroCosto !== u.centroCosto) return false;
  const areasUser = expandirAreasUsuario(u);
  if (!areasUser) return true; // sin restricción de área
  return areasUser.includes(actividad.area);
}

// Filtra una lista de actividades según los permisos del usuario
function filtrarActividadesUsuario(actividades, u) {
  return actividades.filter(a => puedeAccederActividad(u, a));
}

// Devuelve las áreas visibles del usuario para mostrar como etiqueta
function areasUsuarioLabel(u) {
  if (!u || !u.areas) return '';
  return u.areas.join(', ');
}

// Devuelve los usernames que deben recibir notificaciones para un CC dado
function usuariosDelCC(usuarios, cc) {
  if (!usuarios) return [];
  return usuarios
    .filter(u => u.rol === 'responsable_cc' && u.centroCosto === cc)
    .map(u => u.usuario);
}

// Devuelve los usernames de todos los administradores
function adminUsernames(usuarios) {
  if (!usuarios) return [];
  return usuarios.filter(u => u.rol === 'admin').map(u => u.usuario);
}

// Devuelve el estado de un periodo según fechas/horas y forzados
function getEstadoPeriodo(periodos, anio, mes) {
  const p = periodos.find(x => x.anio === anio && x.mes === mes);
  if (!p) return { estado: 'sin_config', config: null, motivo: 'Periodo sin configurar — registros permitidos' };

  if (p.estadoForzado === 'cerrado') return { estado: 'cerrado', config: p, motivo: 'Cierre forzado por administrador' };
  if (p.estadoForzado === 'abierto') return { estado: 'abierto', config: p, motivo: 'Apertura forzada por administrador' };

  const tsApertura = ts(p.fechaApertura, p.horaApertura);
  const tsCierre = ts(p.fechaCierre, p.horaCierre);

  if (tsApertura && AHORA < tsApertura) {
    return { estado: 'por_abrir', config: p,
      motivo: `Apertura programada: ${p.fechaApertura} ${p.horaApertura || '00:00'}` };
  }
  if (tsCierre && AHORA > tsCierre) {
    return { estado: 'cerrado', config: p,
      motivo: `Cerrado el ${p.fechaCierre} a las ${p.horaCierre || '23:59'}` };
  }
  return { estado: 'abierto', config: p,
    motivo: `Cierre programado: ${p.fechaCierre || 'sin fecha'} ${p.horaCierre || ''}`.trim() };
}

// Detecta reprogramaciones vencidas (plazo terminado) y las marca como cerradas
function aplicarCierreAutomatico(reprogs) {
  return reprogs.map(r => {
    if (r.estado !== 'aprobada') return r;
    const fin = ts(r.fechaCierre, r.horaCierre);
    if (fin && AHORA > fin) {
      return {
        ...r,
        estado: 'cerrada',
        fechaCierreReal: AHORA + ':00.000Z',
        cierreAutomatico: true,
      };
    }
    return r;
  });
}

// Formatear timestamp para mostrar
function fmtTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

function fmtRelativo(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff/86400)} d`;
  return d.toLocaleDateString('es-PE');
}

export default function App() {
  const [view, setView] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  const [progress, setProgress] = useState([]);
  const [modifs, setModifs] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reprogramaciones, setReprogramaciones] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [areasPorCC, setAreasPorCC] = useState({ ...AREAS_POR_CC_INICIAL });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sincroniza la referencia mutable AREAS_POR_CC para código legado
  useEffect(() => { AREAS_POR_CC = areasPorCC; }, [areasPorCC]);

  async function saveAreasPorCC(next) {
    setAreasPorCC(next);
    AREAS_POR_CC = next;
    try { await window.storage.set('pnc_v2_areas', JSON.stringify(next), false); } catch (e) {}
  }

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    let acts = [], progs = [], mods = [], pers = [], sols = [], usrs = [], reprogs = [], audit = [], notifs = [];

    try { const r = await window.storage.get('pnc_v2_acts', false); if (r) acts = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get('pnc_v2_prog', false); if (r) progs = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get('pnc_v2_mods', false); if (r) mods = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get('pnc_v2_periodos', false); if (r) pers = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get('pnc_v2_solicitudes', false); if (r) sols = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get('pnc_v2_reprogs', false); if (r) reprogs = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get('pnc_v2_audit', false); if (r) audit = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get('pnc_v2_notifs', false); if (r) notifs = JSON.parse(r.value); } catch (e) {}

    // Cargar áreas custom desde storage; si no existe, usar las predefinidas
    try {
      const r = await window.storage.get('pnc_v2_areas', false);
      if (r) {
        const loaded = JSON.parse(r.value);
        setAreasPorCC(loaded);
        AREAS_POR_CC = loaded;
      }
    } catch (e) {}

    // Usuarios: siempre desde código (prototipo). En producción vendrá de la base.
    usrs = JSON.parse(JSON.stringify(USUARIOS_DEMO));
    setUsuarios(usrs);

    try {
      await window.storage.delete('pnc_v2_currentUser', false);
      await window.storage.set('pnc_v2_usuarios', JSON.stringify(usrs), false);
    } catch (e) {}

    // Seed inicial si la primera vez
    if (acts.length === 0) {
      try {
        const demo = seedDemo();
        acts = demo.activities; progs = demo.progress; mods = demo.modifs;
        pers = demo.periodos; sols = demo.solicitudes;
        await window.storage.set('pnc_v2_acts', JSON.stringify(acts), false);
        await window.storage.set('pnc_v2_prog', JSON.stringify(progs), false);
        await window.storage.set('pnc_v2_mods', JSON.stringify(mods), false);
        await window.storage.set('pnc_v2_periodos', JSON.stringify(pers), false);
        await window.storage.set('pnc_v2_solicitudes', JSON.stringify(sols), false);
      } catch (e) {}
    }

    // Cierre automático de reprogramaciones vencidas
    try {
      const reprogsActualizados = aplicarCierreAutomatico(reprogs);
      if (JSON.stringify(reprogsActualizados) !== JSON.stringify(reprogs)) {
        await window.storage.set('pnc_v2_reprogs', JSON.stringify(reprogsActualizados), false);
        reprogs = reprogsActualizados;
      }
    } catch (e) {}

    setActivities(acts.map(migrarActividadGenericas));
    setProgress(progs);
    setModifs(mods);
    setPeriodos(pers);
    setSolicitudes(sols);
    setReprogramaciones(reprogs);
    setAuditoria(audit);
    setNotificaciones(notifs);
    setLoading(false);
  }

  async function saveActivities(next) {
    setActivities(next);
    try { await window.storage.set('pnc_v2_acts', JSON.stringify(next), false); } catch (e) {}
  }
  async function saveProgress(next) {
    setProgress(next);
    try { await window.storage.set('pnc_v2_prog', JSON.stringify(next), false); } catch (e) {}
  }
  async function saveModifs(next) {
    setModifs(next);
    try { await window.storage.set('pnc_v2_mods', JSON.stringify(next), false); } catch (e) {}
  }
  async function savePeriodos(next) {
    setPeriodos(next);
    try { await window.storage.set('pnc_v2_periodos', JSON.stringify(next), false); } catch (e) {}
  }
  async function saveSolicitudes(next) {
    setSolicitudes(next);
    try { await window.storage.set('pnc_v2_solicitudes', JSON.stringify(next), false); } catch (e) {}
  }
  async function saveUsuarios(next) {
    setUsuarios(next);
    try { await window.storage.set('pnc_v2_usuarios', JSON.stringify(next), false); } catch (e) {}
  }
  async function saveReprogramaciones(next) {
    setReprogramaciones(next);
    try { await window.storage.set('pnc_v2_reprogs', JSON.stringify(next), false); } catch (e) {}
  }
  async function saveAuditoria(next) {
    setAuditoria(next);
    try { await window.storage.set('pnc_v2_audit', JSON.stringify(next), false); } catch (e) {}
  }
  async function saveNotificaciones(next) {
    setNotificaciones(next);
    try { await window.storage.set('pnc_v2_notifs', JSON.stringify(next), false); } catch (e) {}
  }

  // Registrar evento de auditoría
  async function logAuditoria(accion, detalle, contexto = {}) {
    if (!currentUser) return;
    const evento = {
      id: uid(),
      timestamp: new Date().toISOString(),
      usuario: currentUser.usuario,
      nombre: currentUser.nombre,
      rol: currentUser.rol,
      centroCosto: currentUser.centroCosto || '',
      accion,         // ej: 'crear_actividad', 'aprobar_reprog', etc.
      detalle,        // descripción legible
      contexto,       // datos adicionales
    };
    const next = [evento, ...auditoria].slice(0, 2000); // máximo 2000 eventos
    await saveAuditoria(next);
  }

  // Crear notificación dirigida a uno o varios usuarios
  async function notificar({ destinatarios, tipo, titulo, mensaje, link }) {
    const base = {
      id: uid(),
      timestamp: new Date().toISOString(),
      tipo,           // 'solicitud_aprobada', 'reprog_aprobada', 'solicitud_recibida', etc.
      titulo,
      mensaje,
      link: link || null,
      remitente: currentUser?.usuario || 'sistema',
      leida: false,
    };
    const nuevas = (destinatarios || []).map(usr => ({ ...base, id: uid(), destinatario: usr }));
    await saveNotificaciones([...nuevas, ...notificaciones]);
  }
  async function login(u) {
    setCurrentUser(u);
    try { await window.storage.set('pnc_v2_currentUser', JSON.stringify(u), false); } catch (e) {}
    setView('dashboard');
  }
  async function logout() {
    setCurrentUser(null);
    try { await window.storage.delete('pnc_v2_currentUser', false); } catch (e) {}
  }

  async function resetAll() {
    if (!confirm('¿Restaurar datos institucionales PNC 2026? Esto incluye actividades, registros, modificaciones, periodos y usuarios.')) return;
    const demo = seedDemo();
    await saveActivities(demo.activities);
    await saveProgress(demo.progress);
    await saveModifs(demo.modifs);
    await savePeriodos(demo.periodos);
    await saveSolicitudes(demo.solicitudes);
    await saveUsuarios(JSON.parse(JSON.stringify(USUARIOS_DEMO)));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F1E8' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#1E2A3A' }} />
      </div>
    );
  }

  if (!currentUser) {
    return <Login usuarios={usuarios} onLogin={login} />;
  }

  const solicitudesPendientes = esAdmin(currentUser)
    ? solicitudes.filter(s => s.estado === 'pendiente').length
    : 0;
  const reprogPendientes = esAdmin(currentUser)
    ? reprogramaciones.filter(r => r.estado === 'solicitada').length
    : 0;

  // Notificaciones no leídas para el usuario actual
  const misNotifs = currentUser
    ? notificaciones.filter(n => n.destinatario === currentUser.usuario)
    : [];
  const notifsNoLeidas = misNotifs.filter(n => !n.leida).length;

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F1E8', fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <Sidebar
        view={view}
        setView={setView}
        onReset={resetAll}
        solicitudesPendientes={solicitudesPendientes}
        reprogPendientes={reprogPendientes}
        notifsNoLeidas={notifsNoLeidas}
        currentUser={currentUser}
        onLogout={logout}
      />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-10">
          {view === 'dashboard' && <Dashboard activities={activities} progress={progress} modifs={modifs} currentUser={currentUser} />}
          {view === 'centros' && <CentrosCosto activities={activities} progress={progress} modifs={modifs} currentUser={currentUser} />}
          {view === 'programacion' && (
            <Programacion
              activities={activities}
              saveActivities={saveActivities}
              currentUser={currentUser}
              reprogramaciones={reprogramaciones}
              areasPorCC={areasPorCC}
              saveAreasPorCC={saveAreasPorCC}
              logAuditoria={logAuditoria} />
          )}
          {view === 'reprogramacion' && (
            <ReprogramacionPOI
              activities={activities}
              saveActivities={saveActivities}
              progress={progress}
              reprogramaciones={reprogramaciones}
              saveReprogramaciones={saveReprogramaciones}
              periodos={periodos}
              currentUser={currentUser}
              usuarios={usuarios}
              logAuditoria={logAuditoria}
              notificar={notificar}
            />
          )}
          {view === 'seguimiento' && (
            <Seguimiento
              activities={activities}
              progress={progress}
              saveProgress={saveProgress}
              periodos={periodos}
              solicitudes={solicitudes}
              saveSolicitudes={saveSolicitudes}
              currentUser={currentUser}
              usuarios={usuarios}
              logAuditoria={logAuditoria}
              notificar={notificar}
            />
          )}
          {view === 'modificaciones' && (
            <Modificaciones activities={activities} modifs={modifs} saveModifs={saveModifs} currentUser={currentUser} />
          )}
          {view === 'reporte' && esAdmin(currentUser) && <Reporte activities={activities} progress={progress} modifs={modifs} currentUser={currentUser} />}
          {view === 'reporte' && !esAdmin(currentUser) && (
            <Card className="p-12 text-center">
              <div className="text-5xl mb-3">🔒</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A', marginBottom: 8 }}>
                Acceso restringido
              </div>
              <p className="text-sm" style={{ color: '#7A6F5C' }}>
                Este módulo está disponible únicamente para administradores del sistema.
              </p>
            </Card>
          )}
          {view === 'periodos' && esAdmin(currentUser) && (
            <ConfigPeriodos periodos={periodos} savePeriodos={savePeriodos} logAuditoria={logAuditoria} />
          )}
          {view === 'solicitudes' && esAdmin(currentUser) && (
            <Solicitudes
              solicitudes={solicitudes}
              saveSolicitudes={saveSolicitudes}
              reprogramaciones={reprogramaciones}
              saveReprogramaciones={saveReprogramaciones}
              periodos={periodos}
              savePeriodos={savePeriodos}
              activities={activities}
              usuarios={usuarios}
              logAuditoria={logAuditoria}
              notificar={notificar}
            />
          )}
          {view === 'mis_solicitudes' && esResponsableCC(currentUser) && (
            <MisSolicitudes
              solicitudes={solicitudes.filter(s => s.centroCosto === currentUser.centroCosto)}
            />
          )}
          {view === 'usuarios' && esAdmin(currentUser) && (
            <GestionUsuarios usuarios={usuarios} saveUsuarios={saveUsuarios} logAuditoria={logAuditoria} />
          )}
          {view === 'auditoria' && esAdmin(currentUser) && (
            <Auditoria eventos={auditoria} />
          )}
          {view === 'notificaciones' && (
            <Notificaciones
              notificaciones={misNotifs}
              saveNotificaciones={saveNotificaciones}
              allNotificaciones={notificaciones}
              setView={setView}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   PANTALLA DE LOGIN
============================================================ */
function Login({ usuarios, onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  function handleSubmit() {
    const u = usuarios.find(x => x.usuario === usuario.trim() && x.password === password);
    if (!u) {
      setError('Usuario o contraseña incorrectos');
      return;
    }
    setError('');
    onLogin(u);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F1E8', fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg mb-4" style={{ background: '#1E2A3A' }}>
            <Briefcase size={28} style={{ color: '#C9A350' }} />
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: '#1E2A3A' }}>
            POI 2026
          </div>
          <div className="text-xs uppercase tracking-widest mt-1" style={{ color: '#9C7A2B' }}>
            Programa Nuestras Ciudades
          </div>
        </div>

        <div className="rounded-lg p-8" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', boxShadow: '0 4px 12px rgba(30,42,58,0.08)' }}>
          <div className="mb-6">
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
              Iniciar sesión
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
              Ingresa con tu usuario asignado por centro de costo
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Usuario">
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7A6F5C' }} />
                <input type="text" value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-9 pr-3 py-2 rounded-md border text-sm" style={{ borderColor: '#E5DDD0' }}
                  placeholder="ej. admin" autoFocus />
              </div>
            </Field>
            <Field label="Contraseña">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7A6F5C' }} />
                <input type={showPwd ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-9 pr-10 py-2 rounded-md border text-sm" style={{ borderColor: '#E5DDD0' }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPwd ? <EyeOff size={16} style={{ color: '#7A6F5C' }} /> : <Eye size={16} style={{ color: '#7A6F5C' }} />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs" style={{ background: '#F5D5D5', color: '#B33B3B' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="button" onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
              style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
              <Lock size={14} /> Ingresar
            </button>
          </div>

          {/* Botón de usuarios de prueba oculto */}

          {showHint && (
            <div className="mt-3 p-3 rounded-md text-xs space-y-1" style={{ background: '#FAF7F0', color: '#7A6F5C' }}>
              <div className="cursor-pointer hover:bg-stone-100 p-1 rounded"
                onClick={() => { setUsuario('rmalaspina'); setPassword('admin2026'); setError(''); }}>
                <strong>rmalaspina</strong> / admin2026 — Administrador (Planeamiento y Presupuesto)
              </div>
              <div className="cursor-pointer hover:bg-stone-100 p-1 rounded"
                onClick={() => { setUsuario('jccanto'); setPassword('gestion2026'); setError(''); }}>
                <strong>jccanto</strong> / gestion2026 — Julian Ccanto (Admin / GESTIÓN PNC)
              </div>
              <div className="cursor-pointer hover:bg-stone-100 p-1 rounded"
                onClick={() => { setUsuario('salvarado'); setPassword('ugedeus2026'); setError(''); }}>
                <strong>salvarado</strong> / ugedeus2026 — UGEDEUS (Salvador Alvarado)
              </div>
              <div className="cursor-pointer hover:bg-stone-100 p-1 rounded"
                onClick={() => { setUsuario('mayala'); setPassword('ugerdes2026'); setError(''); }}>
                <strong>mayala</strong> / ugerdes2026 — UGERDES (Maximo Ayala — área UGERDES)
              </div>
              <div className="cursor-pointer hover:bg-stone-100 p-1 rounded"
                onClick={() => { setUsuario('dalcalde'); setPassword('pncmaq2026'); setError(''); }}>
                <strong>dalcalde</strong> / pncmaq2026 — David Alcalde (Coord. Nacional PNC-Maquinarias)
              </div>
              <div className="cursor-pointer hover:bg-stone-100 p-1 rounded"
                onClick={() => { setUsuario('jmcsint'); setPassword('pncmaq2026'); setError(''); }}>
                <strong>jmcsint</strong> / pncmaq2026 — Juan Castro (Coord. de Monitoreo PNC-Maquinarias)
              </div>
              <div className="cursor-pointer hover:bg-stone-100 p-1 rounded"
                onClick={() => { setUsuario('ljmoya'); setPassword('unindeus2026'); setError(''); }}>
                <strong>ljmoya</strong> / unindeus2026 — UNINDEUS (Leonardy Moya)
              </div>
              <div className="cursor-pointer hover:bg-stone-100 p-1 rounded"
                onClick={() => { setUsuario('jbarron'); setPassword('directivo2026'); setError(''); }}>
                <strong>jbarron</strong> / directivo2026 — Director DGPP (solo lectura)
              </div>
              <div className="mt-2 pt-2 border-t text-xs italic" style={{ borderColor: '#E5DDD0', color: '#9C7A2B' }}>
                💡 Tip: haz clic en cualquier usuario para autocompletar
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-xs mt-6" style={{ color: '#9C9080' }}>
          Sistema POI · Programa Nuestras Ciudades · 2026
        </div>
      </div>
    </div>
  );
}

function Sidebar({ view, setView, onReset, solicitudesPendientes, reprogPendientes, notifsNoLeidas, currentUser, onLogout }) {
  const items = [
    { id: 'dashboard', label: 'Tablero general', icon: LayoutDashboard, roles: ['admin', 'lector'] },
    { id: 'centros', label: 'Tablero por CC', icon: Building2, roles: ['admin', 'lector', 'responsable_cc'] },
    { id: 'programacion', label: 'Programación POI', icon: ListChecks, roles: ['admin', 'lector', 'responsable_cc'] },
    { id: 'reprogramacion', label: 'Reprogramación POI', icon: RefreshCw, roles: ['admin', 'responsable_cc'] },
    { id: 'seguimiento', label: 'Seguimiento mensual', icon: ClipboardEdit, roles: ['admin', 'responsable_cc'] },
    { id: 'modificaciones', label: 'Modif. presupuestales', icon: Wallet, roles: ['admin', 'lector', 'responsable_cc'] },
    { id: 'reporte', label: 'Reporte mensual', icon: FileText, roles: ['admin'] },
  ];
  const personalItems = [
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, badge: notifsNoLeidas, roles: ['admin', 'responsable_cc', 'lector'] },
    { id: 'mis_solicitudes', label: 'Mis solicitudes', icon: MailOpen, roles: ['responsable_cc'] },
  ];
  const adminItems = [
    { id: 'periodos', label: 'Periodos de registro', icon: CalendarClock, roles: ['admin'] },
    { id: 'solicitudes', label: 'Solicitudes', icon: MailOpen, badge: solicitudesPendientes + reprogPendientes, roles: ['admin'] },
    { id: 'usuarios', label: 'Gestión de usuarios', icon: Shield, roles: ['admin'] },
    { id: 'auditoria', label: 'Bitácora auditoría', icon: History, roles: ['admin'] },
  ];

  const visibleItems = items.filter(it => it.roles.includes(currentUser.rol));
  const visibleAdmin = adminItems.filter(it => it.roles.includes(currentUser.rol));
  const visibleUser = personalItems.filter(it => it.roles.includes(currentUser.rol));

  // Resetear vista si la actual no es accesible
  useEffect(() => {
    const allAccessible = [...visibleItems, ...visibleAdmin, ...visibleUser].map(i => i.id);
    if (!allAccessible.includes(view)) {
      setView(visibleItems[0]?.id || 'centros');
    }
  }, [currentUser]);

  const roleLabel = {
    admin: 'Administrador',
    responsable_cc: 'Responsable',
    lector: 'Solo lectura',
  };
  const roleColor = {
    admin: '#C9A350',
    responsable_cc: '#5C9C7A',
    lector: '#7A8597',
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#1E2A3A', minHeight: '100vh' }}>
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#C9A350' }}>
            <Briefcase size={18} style={{ color: '#1E2A3A' }} />
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: '#F5F1E8' }}>
            POI 2026
          </div>
        </div>
        <div className="text-xs uppercase tracking-widest" style={{ color: '#C9A350' }}>
          Programa Nuestras Ciudades
        </div>
      </div>

      {/* Card de usuario */}
      <div className="mx-3 mb-4 p-3 rounded-md" style={{ background: '#0E1825', border: '1px solid #2C3A4F' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: roleColor[currentUser.rol] }}>
            {currentUser.rol === 'admin' ? <Shield size={14} style={{ color: '#1E2A3A' }} /> :
              currentUser.rol === 'lector' ? <Eye size={14} style={{ color: '#1E2A3A' }} /> :
              <User size={14} style={{ color: '#1E2A3A' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: '#F5F1E8' }}>{currentUser.nombre}</div>
            {currentUser.cargo && (
              <div className="text-xs truncate" style={{ color: '#A89878', fontStyle: 'italic' }}>{currentUser.cargo}</div>
            )}
            <div className="text-xs" style={{ color: roleColor[currentUser.rol] }}>{roleLabel[currentUser.rol]}</div>
          </div>
        </div>
        {currentUser.centroCosto && (
          <div className="text-xs px-2 py-1 rounded mt-1 text-center" style={{ background: '#1E2A3A', color: '#D5C9B0' }}>
            {currentUser.centroCosto}
          </div>
        )}
        {currentUser.areas && currentUser.areas.length > 0 && (
          <div className="text-xs px-2 py-1 rounded mt-1 text-center" style={{ background: '#C9A350', color: '#1E2A3A', fontWeight: 600 }}>
            Área: {currentUser.areas.join(', ')}
          </div>
        )}
      </div>

      <nav className="px-3 flex-1 overflow-y-auto">
        {visibleItems.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button key={it.id} onClick={() => setView(it.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-colors text-left"
              style={{ background: active ? '#C9A350' : 'transparent', color: active ? '#1E2A3A' : '#D5C9B0' }}>
              <Icon size={18} />
              <span className="text-sm font-medium">{it.label}</span>
            </button>
          );
        })}

        {visibleUser.length > 0 && (
          <>
            <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-widest" style={{ color: '#7A8597' }}>
              Mi cuenta
            </div>
            {visibleUser.map((it) => {
              const Icon = it.icon;
              const active = view === it.id;
              return (
                <button key={it.id} onClick={() => setView(it.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-colors text-left"
                  style={{ background: active ? '#C9A350' : 'transparent', color: active ? '#1E2A3A' : '#D5C9B0' }}>
                  <Icon size={18} />
                  <span className="text-sm font-medium flex-1">{it.label}</span>
                  {it.badge > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: active ? '#1E2A3A' : '#C9A350', color: active ? '#C9A350' : '#1E2A3A' }}>
                      {it.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}

        {visibleAdmin.length > 0 && (
          <>
            <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-widest" style={{ color: '#7A8597' }}>
              Administración
            </div>
            {visibleAdmin.map((it) => {
              const Icon = it.icon;
              const active = view === it.id;
              return (
                <button key={it.id} onClick={() => setView(it.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-colors text-left"
                  style={{ background: active ? '#C9A350' : 'transparent', color: active ? '#1E2A3A' : '#D5C9B0' }}>
                  <Icon size={18} />
                  <span className="text-sm font-medium flex-1">{it.label}</span>
                  {it.badge > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: active ? '#1E2A3A' : '#C9A350', color: active ? '#C9A350' : '#1E2A3A' }}>
                      {it.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: '#2C3A4F' }}>
        <button onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors"
          style={{ background: '#0E1825', color: '#D5C9B0', border: '1px solid #2C3A4F' }}>
          <LogOut size={14} /> Cerrar sesión
        </button>
        {esAdmin(currentUser) && (
          <button onClick={onReset}
            className="w-full text-xs px-3 py-2 rounded mt-2 transition-colors"
            style={{ color: '#A89878', borderColor: '#3A4A60', border: '1px solid #3A4A60' }}>
            Restaurar datos PNC
          </button>
        )}
      </div>
    </aside>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#9C7A2B' }}>{subtitle}</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 500, color: '#1E2A3A', lineHeight: 1.1 }}>
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-lg ${className}`}
      style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', boxShadow: '0 1px 2px rgba(30,42,58,0.04)' }}>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-md border text-sm bg-white';
function Field({ label, children, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: '#7A6F5C' }}>{label}</label>
      <div>{children}</div>
    </div>
  );
}

function Pill({ children, color = '#1E2A3A', bg = '#F0E9D9' }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function KPI({ icon: Icon, label, value, hint, highlight }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>{label}</div>
        <Icon size={16} style={{ color: highlight ? '#C9A350' : '#7A6F5C' }} />
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: '#1E2A3A', lineHeight: 1 }}>
        {value}
      </div>
      <div className="text-xs mt-2" style={{ color: '#7A6F5C' }}>{hint}</div>
    </Card>
  );
}

function MesFiltro({ mesFiltro, setMesFiltro, modoMes, setModoMes }) {
  // modoMes:
  //   'individual' (Mensual) → mesFiltro=N → datos solo de ese mes
  //   'acumulado' (Seguimiento al mes) → mesFiltro=N → enero hasta mes N
  const modo = modoMes || 'individual';

  // Garantizar que mesFiltro nunca sea 0 (ya no existe "acumulado anual")
  useEffect(() => {
    if (mesFiltro === 0) setMesFiltro(new Date().getMonth() + 1);
  }, [mesFiltro, setMesFiltro]);

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Calendar size={16} style={{ color: '#7A6F5C' }} />
        <span className="text-xs uppercase tracking-wider font-medium mr-2" style={{ color: '#7A6F5C' }}>Modo:</span>

        <button onClick={() => { setModoMes && setModoMes('individual'); if (mesFiltro === 0) setMesFiltro(new Date().getMonth() + 1); }}
          className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
          style={{
            background: modo === 'individual' ? '#C9A350' : '#F0E9D9',
            color: '#1E2A3A',
          }}>
          Mensual
        </button>

        <button onClick={() => { setModoMes && setModoMes('acumulado'); if (mesFiltro === 0) setMesFiltro(new Date().getMonth() + 1); }}
          className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
          style={{
            background: modo === 'acumulado' ? '#2D7A4E' : '#F0E9D9',
            color: modo === 'acumulado' ? '#FFFFFF' : '#1E2A3A',
          }}>
          Seguimiento al mes
        </button>
      </div>

      {/* Selector de meses */}
      <div className="flex items-center gap-2 flex-wrap pt-2" style={{ borderTop: '1px dashed #E5DDD0' }}>
        <span className="text-xs uppercase tracking-wider font-medium mr-2" style={{ color: '#7A6F5C' }}>
          {modo === 'acumulado' ? 'Seguimiento hasta:' : 'Mes:'}
        </span>
        {MESES.map((m, i) => (
          <button key={i} onClick={() => setMesFiltro(i + 1)}
            className="text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors"
            style={{
              background: mesFiltro === i + 1
                ? (modo === 'acumulado' ? '#2D7A4E' : '#C9A350')
                : '#FAF7F0',
              color: mesFiltro === i + 1
                ? (modo === 'acumulado' ? '#FFFFFF' : '#1E2A3A')
                : '#1E2A3A',
              border: mesFiltro === i + 1
                ? `1px solid ${modo === 'acumulado' ? '#2D7A4E' : '#C9A350'}`
                : '1px solid #E5DDD0',
            }}>
            {MESES_ABR[i]}
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
   DASHBOARD GENERAL
   Con filtro por mes: específico = solo ese mes / Todos = acumulado
============================================================ */
function Dashboard({ activities, progress, modifs, currentUser }) {
  const ccDisponibles = ccsVisibles(currentUser);
  const ccsVisible = CENTROS_COSTO.filter(c => ccDisponibles.includes(c.nombre));
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1); // mes actual
  const [modoMes, setModoMes] = useState('individual'); // 'individual' o 'acumulado'
  // Casos:
  // - modo individual + mesFiltro=0 → acumulado anual (todos los meses)
  // - modo individual + mesFiltro=N → solo ese mes
  // - modo acumulado + mesFiltro=N → enero hasta el mes N (inclusive)
  const esAcumuladoHasta = modoMes === 'acumulado' && mesFiltro > 0;
  const mesLabel = esAcumuladoHasta
    ? `Seguimiento al mes de ${MESES[mesFiltro - 1].toLowerCase()}`
    : `Mensual: ${MESES[mesFiltro - 1]}`;

  // Filtrar actividades según rol y área
  const actsVisibles = esResponsableCC(currentUser)
    ? filtrarActividadesUsuario(activities, currentUser)
    : activities;
  const progVisibles = esResponsableCC(currentUser)
    ? progress.filter(p => actsVisibles.some(a => a.id === p.actividadId))
    : progress;
  // Las modificaciones se filtran por CC y, si el usuario tiene áreas, también por área
  const areasUser = expandirAreasUsuario(currentUser);
  const modifsVisibles = esResponsableCC(currentUser)
    ? modifs.filter(m => {
        if (m.centroCosto !== currentUser.centroCosto) return false;
        if (!areasUser) return true;
        // Si la modificación referencia un AOI, verificar que sea de las áreas del usuario
        if (m.codigoAOI) {
          const act = activities.find(a => a.codigoAOI === m.codigoAOI);
          if (act) return areasUser.includes(act.area);
        }
        return true;
      })
    : modifs;

  // ============ CÁLCULOS SEGÚN PIA/PIM DE PROGRAMACIÓN ============
  // PIA = suma de programación PIA (genéricas) de todas las actividades visibles
  const totalPIA = actsVisibles.reduce((s, a) => s + totalFinancieroActividad(a, 'pia'), 0);
  // PIM = suma de programación PIM (genéricas) de todas las actividades visibles
  const totalPIM = actsVisibles.reduce((s, a) => s + totalFinancieroActividad(a, 'pim'), 0);
  const variacionPIM = totalPIA > 0 ? ((totalPIM - totalPIA) / totalPIA) * 100 : 0;

  // Física PIA y PIM anuales
  const totalFisPIA = actsVisibles.reduce((s, a) => s + (Number(a.metaAnualFisica) || 0), 0);
  const totalFisPIM = actsVisibles.reduce((s, a) => s + (Number(a.metaAnualFisicaPIM ?? a.metaAnualFisica) || 0), 0);

  // Ejecución financiera y física según modo
  //   - Mensual:          ejecución del mes vs programado del mes (PIM del mes)
  //   - Seguimiento al mes: ejecución acumulada (ene-mes) vs total programado PIM anual
  const progAplicable = esAcumuladoHasta
    ? progVisibles.filter(p => p.mes <= mesFiltro)
    : progVisibles.filter(p => p.mes === mesFiltro);
  const totalEjecFin = progAplicable.reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
  const totalEjecFis = progAplicable.reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);

  // Programado financiero (referencia para el %)
  let totalProgFin = 0;
  if (esAcumuladoHasta) {
    // Total programado PIM anual (enero a diciembre)
    totalProgFin = totalPIM;
  } else {
    // Programado PIM del mes seleccionado
    totalProgFin = actsVisibles.reduce((s, a) => s + financieroMesActividad(a, 'pim', mesFiltro - 1), 0);
  }
  const ejecFinPct = totalProgFin > 0 ? (totalEjecFin / totalProgFin) * 100 : 0;

  // Programado físico (referencia para el %)
  let totalMetaFis = 0;
  if (esAcumuladoHasta) {
    // Total programado físico anual (enero a diciembre)
    totalMetaFis = totalFisPIM;
  } else {
    // Programado físico del mes seleccionado
    totalMetaFis = actsVisibles.reduce((s, a) => s + (Number(a.programacion?.[mesFiltro - 1]?.fisica) || 0), 0);
  }
  const ejecFisPct = totalMetaFis > 0 ? (totalEjecFis / totalMetaFis) * 100 : 0;

  // Gráfico siempre muestra los 12 meses (es la vista temporal)
  const chartData = MESES.map((mes, i) => {
    let progFin = 0, progFis = 0;
    actsVisibles.forEach(a => {
      progFin += financieroMesActividad(a, 'pim', i);
      progFis += Number(a.programacion?.[i]?.fisica) || 0;
    });
    const monthRegs = progVisibles.filter(p => p.mes === i + 1);
    const ejecFin = monthRegs.reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
    const ejecFis = monthRegs.reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);
    const pFin = progFin > 0 ? (ejecFin / progFin) * 100 : 0;
    const pFis = progFis > 0 ? (ejecFis / progFis) * 100 : 0;
    return {
      mes: MESES_ABR[i],
      Programado: progFin,
      Ejecutado: ejecFin,
      ProgFis: progFis,
      EjecFis: ejecFis,
      pctFin: pFin,
      pctFis: pFis,
      pctFinLabel: ejecFin > 0 ? `${pFin.toFixed(0)}%` : '',
      pctFisLabel: ejecFis > 0 ? `${pFis.toFixed(0)}%` : '',
      seleccionado: esAcumuladoHasta ? (i + 1) <= mesFiltro : (i + 1) === mesFiltro,
      esAcumGeneral: false,
    };
  });

  // Columna "Acumulado General" al final: consolidado anual (todos los meses)
  // Financiero: PIM total anual vs Ejecutado total anual
  // Físico: Programado total anual vs Ejecutado total anual
  const totalEjecFinAnual = progVisibles.reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
  const totalEjecFisAnual = progVisibles.reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);
  const totalProgFisAnual = actsVisibles.reduce((s, a) =>
    s + (a.programacion || []).reduce((ss, p) => ss + (Number(p?.fisica) || 0), 0), 0);
  const pFinAcum = totalPIM > 0 ? (totalEjecFinAnual / totalPIM) * 100 : 0;
  const pFisAcum = totalProgFisAnual > 0 ? (totalEjecFisAnual / totalProgFisAnual) * 100 : 0;
  chartData.push({
    mes: 'ACUM.',
    Programado: totalPIM,
    Ejecutado: totalEjecFinAnual,
    ProgFis: totalProgFisAnual,
    EjecFis: totalEjecFisAnual,
    pctFin: pFinAcum,
    pctFis: pFisAcum,
    pctFinLabel: totalEjecFinAnual > 0 ? `${pFinAcum.toFixed(0)}%` : '',
    pctFisLabel: totalEjecFisAnual > 0 ? `${pFisAcum.toFixed(0)}%` : '',
    seleccionado: true,
    esAcumGeneral: true,
  });

  // Resumen por CC según filtro (solo CCs visibles)
  const ccData = ccsVisible.map(cc => {
    const acts = actsVisibles.filter(a => a.centroCosto === cc.nombre);
    // PIA y PIM del CC desde las genéricas
    const piaCC = acts.reduce((s, a) => s + totalFinancieroActividad(a, 'pia'), 0);
    const pim = acts.reduce((s, a) => s + totalFinancieroActividad(a, 'pim'), 0);
    const variacion = piaCC > 0 ? ((pim - piaCC) / piaCC) * 100 : 0;

    // Ejecución financiera del CC según filtro
    const ejecFin = progAplicable
      .filter(p => acts.some(a => a.id === p.actividadId))
      .reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
    // Programado de referencia: PIM del mes (Mensual) o PIM anual (Seguimiento al mes)
    let progFinCC = 0;
    acts.forEach(a => {
      if (esAcumuladoHasta) progFinCC += totalFinancieroActividad(a, 'pim');
      else progFinCC += financieroMesActividad(a, 'pim', mesFiltro - 1);
    });
    const ejecFinCCPct = progFinCC > 0 ? (ejecFin / progFinCC) * 100 : 0;

    // Físico del CC según modo
    let metaCC = 0, avCC = 0;
    if (esAcumuladoHasta) {
      metaCC = acts.reduce((s, a) => s + (Number(a.metaAnualFisicaPIM ?? a.metaAnualFisica) || 0), 0);
      avCC = progVisibles.filter(p => p.mes <= mesFiltro && acts.some(a => a.id === p.actividadId))
        .reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);
    } else {
      acts.forEach(a => {
        metaCC += Number(a.programacion?.[mesFiltro - 1]?.fisica) || 0;
      });
      avCC = progVisibles.filter(p => p.mes === mesFiltro && acts.some(a => a.id === p.actividadId))
        .reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);
    }
    const ejecFisCCPct = metaCC > 0 ? (avCC / metaCC) * 100 : 0;
    return { ...cc, pia: piaCC, pim, variacion, actividades: acts.length, ejecFin, ejecFinPct: ejecFinCCPct, ejecFisPct: ejecFisCCPct };
  });

  return (
    <>
      <PageHeader title="Tablero general" subtitle="POI 2026 — Programa Nuestras Ciudades" />

      <MesFiltro mesFiltro={mesFiltro} setMesFiltro={setMesFiltro} modoMes={modoMes} setModoMes={setModoMes} />

      <div className="grid grid-cols-2 gap-4 mb-8">
        <KPI icon={Wallet} label="PIA (programación PIA)" value={`S/ ${fmtEntero(totalPIA)}`} hint="presupuesto inicial de apertura" />
        <KPI icon={TrendingUp}
          label="PIM (programación PIM)"
          value={`S/ ${fmtEntero(totalPIM)}`}
          hint={`${variacionPIM >= 0 ? '+' : ''}${variacionPIM.toFixed(2)}% vs PIA`}
          highlight />
      </div>

      {/* Gauges circulares de avance global */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-6 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
            {esAcumuladoHasta
              ? `Ejecución financiera al mes de ${MESES[mesFiltro-1].toLowerCase()} vs PIM anual`
              : `Ejecución financiera — ${MESES[mesFiltro-1]} (vs programado del mes)`}
          </div>
          <GaugeCircular
            pct={ejecFinPct}
            label={`S/ ${fmtEntero(totalEjecFin)} de S/ ${fmtEntero(totalProgFin)}`}
            sublabel="ejecutado"
            size={180}
          />
        </Card>
        <Card className="p-6 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
            {esAcumuladoHasta
              ? `Ejecución física al mes de ${MESES[mesFiltro-1].toLowerCase()} vs física anual`
              : `Ejecución física — ${MESES[mesFiltro-1]} (vs programado del mes)`}
          </div>
          <GaugeCircular
            pct={ejecFisPct}
            label={`${fmtEntero(totalEjecFis)} de ${fmtEntero(totalMetaFis)} unidades`}
            sublabel="cumplido"
            size={180}
          />
        </Card>
      </div>

      {/* Ejecución financiera mensual - barra solapada */}
      <Card className="p-6 mb-6">
        <div className="mb-4">
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: '#1E2A3A' }}>
            Ejecución financiera mensual
          </div>
          <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
            Programado (PIM) vs ejecutado {!esAcumuladoHasta && `— Mes resaltado: ${MESES[mesFiltro-1]}`}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barCategoryGap="20%" barGap={-30} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#7A6F5C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#7A6F5C' }} tickFormatter={fmtMillonesEnteros} />
            <Tooltip
              contentStyle={{ background: '#FFF', border: '1px solid #E5DDD0', borderRadius: 6, fontSize: 12 }}
              formatter={(v) => fmtMoney(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Programado" name="Programado" radius={[3, 3, 0, 0]} barSize={38}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.esAcumGeneral ? '#1E2A3A' : (d.seleccionado ? '#8A8A8A' : '#C9C9C9')} />
              ))}
              <LabelList dataKey="pctFinLabel" content={PctBarLabel} />
            </Bar>
            <Bar dataKey="Ejecutado" name="Ejecutado" radius={[3, 3, 0, 0]} barSize={22}>
              {chartData.map((d, i) => {
                const pctMes = d.Programado > 0 ? (d.Ejecutado / d.Programado) * 100 : 0;
                const color = d.esAcumGeneral ? '#C9A350' : (d.seleccionado ? colorEjecucion(pctMes) : colorEjecucionTenue(pctMes));
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Ejecución física mensual - barra solapada */}
      <Card className="p-6 mb-8">
        <div className="mb-4">
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: '#1E2A3A' }}>
            Ejecución física mensual
          </div>
          <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
            Programado vs ejecutado {esAcumuladoHasta ? `— Acumulado a ${MESES[mesFiltro-1].toLowerCase()}` : `— Mes: ${MESES[mesFiltro-1]}`}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barCategoryGap="20%" barGap={-30} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#7A6F5C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#7A6F5C' }} />
            <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #E5DDD0', borderRadius: 6, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="ProgFis" name="Programado" radius={[3, 3, 0, 0]} barSize={38}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.esAcumGeneral ? '#1E2A3A' : (d.seleccionado ? '#8A8A8A' : '#C9C9C9')} />
              ))}
              <LabelList dataKey="pctFisLabel" content={PctBarLabel} />
            </Bar>
            <Bar dataKey="EjecFis" name="Ejecutado" radius={[3, 3, 0, 0]} barSize={22}>
              {chartData.map((d, i) => {
                const pctMes = d.ProgFis > 0 ? (d.EjecFis / d.ProgFis) * 100 : 0;
                const color = d.esAcumGeneral ? '#C9A350' : (d.seleccionado ? colorEjecucion(pctMes) : colorEjecucionTenue(pctMes));
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: '#1E2A3A' }}>
            Resumen por centro de costo
          </div>
          <Pill bg={esAcumuladoHasta ? '#E8F2EC' : '#FBF1D9'} color={esAcumuladoHasta ? '#2D7A4E' : '#9C7A2B'}>
            {mesLabel}
          </Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Centro de costo</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>PIA</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>PIM</th>
                <th className="text-center px-3 py-2 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Variación</th>
                <th className="text-center px-3 py-2 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Ejec. física</th>
                <th className="text-center px-3 py-2 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Ejec. financiera</th>
                <th className="text-center px-3 py-2 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Actividades</th>
              </tr>
            </thead>
            <tbody>
              {ccData.map((cc, i) => (
                <tr key={i} className="border-b last:border-b-0" style={{ borderColor: '#E5DDD0' }}>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold" style={{ color: '#1E2A3A' }}>{cc.nombre}</div>
                    <div className="text-xs font-mono" style={{ color: '#9C7A2B' }}>{cc.codigo}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right" style={{ color: '#1E2A3A' }}>{fmtMoneyShort(cc.pia)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold" style={{ color: '#1E2A3A' }}>{fmtMoneyShort(cc.pim)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span style={{ color: cc.variacion > 0 ? '#2D7A4E' : cc.variacion < 0 ? '#B33B3B' : '#7A6F5C', fontWeight: 600 }}>
                      {cc.variacion >= 0 ? '+' : ''}{cc.variacion.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <ProgressMini pct={cc.ejecFisPct} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ProgressMini pct={cc.ejecFinPct} />
                  </td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#1E2A3A' }}>{cc.actividades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function ProgressMini({ pct }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5DDD0', minWidth: 60 }}>
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, background: '#C9A350' }} />
      </div>
      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#1E2A3A' }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

/* Gauge circular de progreso (anillo) */
function GaugeCircular({ pct, label, sublabel, size = 160 }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  // Color según umbrales: ≥95% verde, ≥75% ámbar, <75% rojo
  const dynColor = colorEjecucion(pct);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Anillo de fondo */}
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke="#E5DDD0" strokeWidth={stroke} />
          {/* Anillo de progreso */}
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={dynColor} strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: '#1E2A3A', lineHeight: 1 }}>
            {clamped.toFixed(1)}%
          </div>
          {sublabel && <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>{sublabel}</div>}
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold text-center" style={{ color: '#1E2A3A' }}>{label}</div>
    </div>
  );
}

// Color según porcentaje de ejecución
function colorEjecucion(pct) {
  const v = Number(pct) || 0;
  if (v >= 95) return '#2D7A4E';   // verde
  if (v >= 75) return '#D89A1F';   // ámbar
  return '#B33B3B';                // rojo
}

// Versión atenuada del color (para barras de meses no seleccionados)
function colorEjecucionTenue(pct) {
  const v = Number(pct) || 0;
  if (v >= 95) return '#A8C9B3';
  if (v >= 75) return '#F0D9A0';
  return '#E5B3B3';
}

/* ============================================================
   TABLERO POR CENTRO DE COSTOS
   Con filtro por mes: específico = solo ese mes / Todos = acumulado
============================================================ */
function CentrosCosto({ activities, progress, modifs, currentUser }) {
  const ccDisponibles = ccsVisibles(currentUser);
  const [ccSel, setCcSel] = useState(ccDisponibles[0] || CENTROS_COSTO[0].nombre);
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1);
  const [modoMes, setModoMes] = useState('individual');
  const esAcumuladoHasta = modoMes === 'acumulado' && mesFiltro > 0;
  const mesLabel = esAcumuladoHasta
    ? `Seguimiento al mes de ${MESES[mesFiltro - 1].toLowerCase()}`
    : `Mensual: ${MESES[mesFiltro - 1]}`;

  const cc = CENTROS_COSTO.find(c => c.nombre === ccSel);

  // Si el usuario es responsable con áreas restringidas, solo ve esas actividades
  const acts = esResponsableCC(currentUser)
    ? filtrarActividadesUsuario(activities.filter(a => a.centroCosto === ccSel), currentUser)
    : activities.filter(a => a.centroCosto === ccSel);

  // PIA y PIM del CC desde las genéricas de programación
  const piaCC = acts.reduce((s, a) => s + totalFinancieroActividad(a, 'pia'), 0);
  const pim = acts.reduce((s, a) => s + totalFinancieroActividad(a, 'pim'), 0);
  const variacion = piaCC > 0 ? ((pim - piaCC) / piaCC) * 100 : 0;

  // Física PIA y PIM anuales del CC
  const fisPIA_CC = acts.reduce((s, a) => s + (Number(a.metaAnualFisica) || 0), 0);
  const fisPIM_CC = acts.reduce((s, a) => s + (Number(a.metaAnualFisicaPIM ?? a.metaAnualFisica) || 0), 0);

  // Datos mensuales: prog (PIM) / ejec físico y financiero por mes, con acumulados
  const data = MESES.map((mes, i) => {
    let progFis = 0, progFin = 0;
    acts.forEach(a => {
      progFis += Number(a.programacion?.[i]?.fisica) || 0;
      progFin += financieroMesActividad(a, 'pim', i);
    });
    const monthProgs = progress.filter(p => p.mes === i + 1 && acts.some(a => a.id === p.actividadId));
    const ejecFis = monthProgs.reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);
    const ejecFin = monthProgs.reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
    return { mes: MESES_ABR[i], mesIdx: i + 1, progFis, progFin, ejecFis, ejecFin,
      pctFin: progFin > 0 ? (ejecFin / progFin) * 100 : 0,
      pctFis: progFis > 0 ? (ejecFis / progFis) * 100 : 0,
      pctFinLabel: ejecFin > 0 ? `${(progFin > 0 ? (ejecFin / progFin) * 100 : 0).toFixed(0)}%` : '',
      pctFisLabel: ejecFis > 0 ? `${(progFis > 0 ? (ejecFis / progFis) * 100 : 0).toFixed(0)}%` : '' };
  });
  let accProgFis = 0, accProgFin = 0, accEjecFis = 0, accEjecFin = 0;
  data.forEach(d => {
    accProgFis += d.progFis; d.accProgFis = accProgFis;
    accProgFin += d.progFin; d.accProgFin = accProgFin;
    accEjecFis += d.ejecFis; d.accEjecFis = accEjecFis;
    accEjecFin += d.ejecFin; d.accEjecFin = accEjecFin;
  });

  // Marcar el mes seleccionado o el rango acumulado
  data.forEach(d => {
    d.seleccionado = esAcumuladoHasta ? d.mesIdx <= mesFiltro : d.mesIdx === mesFiltro;
    d.esAcumGeneral = false;
  });

  // Columna "Acumulado General" al final: consolidado anual del CC
  const totProgFisAnualCC = data.reduce((s, d) => s + d.progFis, 0);
  const totProgFinAnualCC = data.reduce((s, d) => s + d.progFin, 0);
  const totEjecFisAnualCC = data.reduce((s, d) => s + d.ejecFis, 0);
  const totEjecFinAnualCC = data.reduce((s, d) => s + d.ejecFin, 0);
  data.push({
    mes: 'ACUM.',
    mesIdx: 13,
    progFis: totProgFisAnualCC,
    progFin: totProgFinAnualCC,
    ejecFis: totEjecFisAnualCC,
    ejecFin: totEjecFinAnualCC,
    pctFin: totProgFinAnualCC > 0 ? (totEjecFinAnualCC / totProgFinAnualCC) * 100 : 0,
    pctFis: totProgFisAnualCC > 0 ? (totEjecFisAnualCC / totProgFisAnualCC) * 100 : 0,
    pctFinLabel: totEjecFinAnualCC > 0 ? `${(totProgFinAnualCC > 0 ? (totEjecFinAnualCC / totProgFinAnualCC) * 100 : 0).toFixed(0)}%` : '',
    pctFisLabel: totEjecFisAnualCC > 0 ? `${(totProgFisAnualCC > 0 ? (totEjecFisAnualCC / totProgFisAnualCC) * 100 : 0).toFixed(0)}%` : '',
    seleccionado: true,
    esAcumGeneral: true,
  });

  // Cálculo de KPIs según modo
  //   - Mensual:           ejec del mes vs programado PIM del mes
  //   - Seguimiento al mes: ejec acumulada (ene-mes) vs total PIM/física anual
  let kpiProgFis, kpiProgFin, kpiEjecFis, kpiEjecFin;
  if (esAcumuladoHasta) {
    kpiProgFin = pim;          // total PIM anual del CC
    kpiProgFis = fisPIM_CC;    // total física anual del CC
    kpiEjecFis = data.slice(0, mesFiltro).reduce((s, d) => s + d.ejecFis, 0);
    kpiEjecFin = data.slice(0, mesFiltro).reduce((s, d) => s + d.ejecFin, 0);
  } else {
    const d = data[mesFiltro - 1];
    kpiProgFis = d.progFis;
    kpiProgFin = d.progFin;
    kpiEjecFis = d.ejecFis;
    kpiEjecFin = d.ejecFin;
  }
  const ejecFisPct = kpiProgFis > 0 ? (kpiEjecFis / kpiProgFis) * 100 : 0;
  const ejecFinPct = kpiProgFin > 0 ? (kpiEjecFin / kpiProgFin) * 100 : 0;

  return (
    <>
      <PageHeader title="Tablero por centro de costo" subtitle="Ejecución detallada" />

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} style={{ color: '#7A6F5C' }} />
          <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#7A6F5C' }}>Centro de costo:</span>
          {CENTROS_COSTO.filter(c => ccDisponibles.includes(c.nombre)).map(c => (
            <button key={c.codigo} onClick={() => setCcSel(c.nombre)}
              className="text-xs px-3 py-1 rounded-md font-medium"
              style={{
                background: ccSel === c.nombre ? '#1E2A3A' : '#F0E9D9',
                color: ccSel === c.nombre ? '#F5F1E8' : '#1E2A3A',
              }}>
              {c.nombre}
            </button>
          ))}
          {esResponsableCC(currentUser) && (
            <span className="text-xs ml-2" style={{ color: '#9C7A2B' }}>
              Acceso restringido a tu centro de costo
            </span>
          )}
        </div>
      </Card>

      <MesFiltro mesFiltro={mesFiltro} setMesFiltro={setMesFiltro} modoMes={modoMes} setModoMes={setModoMes} />

      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="text-xs font-mono mb-1" style={{ color: '#9C7A2B' }}>{cc.codigo}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: '#1E2A3A' }}>
              {cc.nombre}
            </div>
            <div className="text-sm mt-2" style={{ color: '#7A6F5C' }}>{cc.desc}</div>
          </div>
          <div className="text-right">
            <Pill bg={esAcumuladoHasta ? '#E8F2EC' : '#FBF1D9'} color={esAcumuladoHasta ? '#2D7A4E' : '#9C7A2B'}>
              {mesLabel}
            </Pill>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <KPI icon={Wallet} label="PIA (programación PIA)" value={`S/ ${fmtEntero(piaCC)}`} hint="Presupuesto inicial de apertura" />
        <KPI icon={TrendingUp}
          label="PIM (programación PIM)"
          value={`S/ ${fmtEntero(pim)}`}
          hint={`${variacion >= 0 ? '+' : ''}${variacion.toFixed(2)}% vs PIA`}
          highlight />
      </div>

      {/* Gauges circulares de avance */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-6 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
            {esAcumuladoHasta
              ? `Ejecución financiera al mes de ${MESES[mesFiltro-1].toLowerCase()} vs PIM anual`
              : `Ejecución financiera — ${MESES[mesFiltro-1]} (vs programado del mes)`}
          </div>
          <GaugeCircular
            pct={ejecFinPct}
            label={`S/ ${fmtEntero(kpiEjecFin)} de S/ ${fmtEntero(kpiProgFin)}`}
            sublabel="ejecutado"
            size={180}
          />
        </Card>
        <Card className="p-6 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
            {esAcumuladoHasta
              ? `Ejecución física al mes de ${MESES[mesFiltro-1].toLowerCase()} vs física anual`
              : `Ejecución física — ${MESES[mesFiltro-1]} (vs programado del mes)`}
          </div>
          <GaugeCircular
            pct={ejecFisPct}
            label={`${fmtEntero(kpiEjecFis)} de ${fmtEntero(kpiProgFis)} unidades`}
            sublabel="cumplido"
            size={180}
          />
        </Card>
      </div>

      {/* Ejecución física mensual - barra solapada */}
      <Card className="p-6 mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: '#1E2A3A' }}>
              Ejecución física mensual
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
              Programado vs ejecutado {esAcumuladoHasta ? `— Acumulado a ${MESES[mesFiltro-1].toLowerCase()}` : `— Mes: ${MESES[mesFiltro-1]}`}
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barCategoryGap="20%" barGap={-30} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#7A6F5C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#7A6F5C' }} />
            <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #E5DDD0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="progFis" name="Programado" radius={[3, 3, 0, 0]} barSize={38}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.esAcumGeneral ? '#1E2A3A' : (d.seleccionado ? '#8A8A8A' : '#C9C9C9')} />
              ))}
              <LabelList dataKey="pctFisLabel" content={PctBarLabel} />
            </Bar>
            <Bar dataKey="ejecFis" name="Ejecutado" radius={[3, 3, 0, 0]} barSize={22}>
              {data.map((d, i) => {
                const pctMes = d.progFis > 0 ? (d.ejecFis / d.progFis) * 100 : 0;
                const color = d.esAcumGeneral ? '#C9A350' : (d.seleccionado ? colorEjecucion(pctMes) : colorEjecucionTenue(pctMes));
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Ejecución financiera mensual - barra solapada */}
      <Card className="p-6 mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: '#1E2A3A' }}>
              Ejecución financiera mensual
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
              Programado (PIM) vs ejecutado {esAcumuladoHasta ? `— Acumulado a ${MESES[mesFiltro-1].toLowerCase()}` : `— Mes: ${MESES[mesFiltro-1]}`}
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barCategoryGap="20%" barGap={-30} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#7A6F5C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#7A6F5C' }} tickFormatter={fmtMillonesEnteros} />
            <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #E5DDD0', fontSize: 12 }} formatter={(v) => fmtMoney(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="progFin" name="Programado" radius={[3, 3, 0, 0]} barSize={38}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.esAcumGeneral ? '#1E2A3A' : (d.seleccionado ? '#8A8A8A' : '#C9C9C9')} />
              ))}
              <LabelList dataKey="pctFinLabel" content={PctBarLabel} />
            </Bar>
            <Bar dataKey="ejecFin" name="Ejecutado" radius={[3, 3, 0, 0]} barSize={22}>
              {data.map((d, i) => {
                const pctMes = d.progFin > 0 ? (d.ejecFin / d.progFin) * 100 : 0;
                const color = d.esAcumGeneral ? '#C9A350' : (d.seleccionado ? colorEjecucion(pctMes) : colorEjecucionTenue(pctMes));
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabla detalle por actividad operativa */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: '#1E2A3A' }}>
              Detalle por actividad operativa
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
              {esAcumuladoHasta
                ? `Seguimiento al mes de ${MESES[mesFiltro-1].toLowerCase()} (enero – ${MESES[mesFiltro-1].toLowerCase()})`
                : `Datos del mes de ${MESES[mesFiltro-1]}`}
            </div>
          </div>
          <Pill bg={esAcumuladoHasta ? '#E8F2EC' : '#FBF1D9'} color={esAcumuladoHasta ? '#2D7A4E' : '#9C7A2B'}>
            {mesLabel}
          </Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#F0E9D9' }}>
                <th className="text-left px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Código AOI</th>
                <th className="text-left px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Actividad operativa</th>
                <th className="text-center px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>U.M.</th>
                <th className="text-right px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Físico prog.</th>
                <th className="text-right px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Físico ejec.</th>
                <th className="text-center px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>% Avance fís.</th>
                <th className="text-right px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Fin. prog. (S/)</th>
                <th className="text-right px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Fin. ejec. (S/)</th>
                <th className="text-center px-2 py-2 uppercase tracking-wider" style={{ color: '#7A6F5C' }}>% Avance fin.</th>
              </tr>
            </thead>
            <tbody>
              {acts.length === 0 && (
                <tr><td colSpan={9} className="text-center py-6" style={{ color: '#7A6F5C' }}>
                  Sin actividades en este centro de costo.
                </td></tr>
              )}
              {acts.map((a) => {
                let progFis, progFin, ejecFis, ejecFin;
                if (esAcumuladoHasta) {
                  // Seguimiento al mes: programado anual PIM, ejecución acumulada ene-mes
                  progFis = Number(a.metaAnualFisicaPIM ?? a.metaAnualFisica) || 0;
                  progFin = totalFinancieroActividad(a, 'pim');
                  const regs = progress.filter(p => p.actividadId === a.id && p.mes <= mesFiltro);
                  ejecFis = regs.reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);
                  ejecFin = regs.reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
                } else {
                  // Mensual: programado PIM del mes, ejecución del mes
                  progFis = Number(a.programacion?.[mesFiltro-1]?.fisica) || 0;
                  progFin = financieroMesActividad(a, 'pim', mesFiltro - 1);
                  const reg = progress.find(p => p.actividadId === a.id && p.mes === mesFiltro);
                  ejecFis = reg ? Number(reg.avanceFisico) || 0 : 0;
                  ejecFin = reg ? Number(reg.avanceFinanciero) || 0 : 0;
                }
                const pctFis = progFis > 0 ? (ejecFis / progFis) * 100 : 0;
                const pctFin = progFin > 0 ? (ejecFin / progFin) * 100 : 0;
                return (
                  <tr key={a.id} className="border-b" style={{ borderColor: '#E5DDD0' }}>
                    <td className="px-2 py-2 font-mono" style={{ color: '#1E2A3A' }}>{a.codigoAOI}</td>
                    <td className="px-2 py-2" style={{ color: '#1E2A3A' }}>
                      <div className="leading-snug" style={{ maxWidth: 320 }}>{a.nombre}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#9C7A2B' }}>{a.area}</div>
                    </td>
                    <td className="px-2 py-2 text-center" style={{ color: '#7A6F5C' }}>{a.unidadMedida}</td>
                    <td className="px-2 py-2 text-right" style={{ color: '#1E2A3A' }}>{fmtEntero(progFis)}</td>
                    <td className="px-2 py-2 text-right font-semibold" style={{ color: '#C9A350' }}>{fmtEntero(ejecFis)}</td>
                    <td className="px-2 py-2">
                      <ProgressMini pct={pctFis} />
                    </td>
                    <td className="px-2 py-2 text-right" style={{ color: '#1E2A3A' }}>{fmtEntero(progFin)}</td>
                    <td className="px-2 py-2 text-right font-semibold" style={{ color: '#C9A350' }}>{fmtEntero(ejecFin)}</td>
                    <td className="px-2 py-2">
                      <ProgressMini pct={pctFin} />
                    </td>
                  </tr>
                );
              })}
              {/* Fila de totales */}
              {acts.length > 0 && (() => {
                let totProgFis = 0, totProgFin = 0, totEjecFis = 0, totEjecFin = 0;
                acts.forEach(a => {
                  if (esAcumuladoHasta) {
                    totProgFis += Number(a.metaAnualFisicaPIM ?? a.metaAnualFisica) || 0;
                    totProgFin += totalFinancieroActividad(a, 'pim');
                    const regs = progress.filter(p => p.actividadId === a.id && p.mes <= mesFiltro);
                    totEjecFis += regs.reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);
                    totEjecFin += regs.reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
                  } else {
                    totProgFis += Number(a.programacion?.[mesFiltro-1]?.fisica) || 0;
                    totProgFin += financieroMesActividad(a, 'pim', mesFiltro - 1);
                    const reg = progress.find(p => p.actividadId === a.id && p.mes === mesFiltro);
                    if (reg) {
                      totEjecFis += Number(reg.avanceFisico) || 0;
                      totEjecFin += Number(reg.avanceFinanciero) || 0;
                    }
                  }
                });
                const totPctFis = totProgFis > 0 ? (totEjecFis / totProgFis) * 100 : 0;
                const totPctFin = totProgFin > 0 ? (totEjecFin / totProgFin) * 100 : 0;
                return (
                  <tr style={{ background: '#F0E9D9' }}>
                    <td className="px-2 py-2 font-bold" style={{ color: '#1E2A3A' }} colSpan={3}>TOTAL</td>
                    <td className="px-2 py-2 text-right font-bold" style={{ color: '#1E2A3A' }}>{fmtEntero(totProgFis)}</td>
                    <td className="px-2 py-2 text-right font-bold" style={{ color: '#C9A350' }}>{fmtEntero(totEjecFis)}</td>
                    <td className="px-2 py-2 text-center font-bold" style={{ color: '#1E2A3A' }}>{fmtPct(totPctFis)}</td>
                    <td className="px-2 py-2 text-right font-bold" style={{ color: '#1E2A3A' }}>{fmtEntero(totProgFin)}</td>
                    <td className="px-2 py-2 text-right font-bold" style={{ color: '#C9A350' }}>{fmtEntero(totEjecFin)}</td>
                    <td className="px-2 py-2 text-center font-bold" style={{ color: '#1E2A3A' }}>{fmtPct(totPctFin)}</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* ============================================================
   PROGRAMACIÓN POI
============================================================ */
function Programacion({ activities, saveActivities, currentUser, reprogramaciones = [], areasPorCC, saveAreasPorCC, logAuditoria }) {
  const ccDisponibles = ccsVisibles(currentUser);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [filtroCC, setFiltroCC] = useState(esResponsableCC(currentUser) ? currentUser.centroCosto : 'TODOS');
  const [filtroArea, setFiltroArea] = useState('TODAS');
  const [filtroMesProg, setFiltroMesProg] = useState(0); // 0 = año completo; 1-12 = ver columna de ese mes
  const [verHistorial, setVerHistorial] = useState(null);
  const [showGestionAreas, setShowGestionAreas] = useState(false);

  // Usar areasPorCC dinámico si fue pasado por props; fallback al estático
  const areasMap = areasPorCC || AREAS_POR_CC;

  // Exportar la programación a Excel (CSV compatible con Excel, separado por ;)
  function exportarProgramacionExcel() {
    const rows = [];
    // Cabecera
    const cab = ['CC', 'Área', 'Cód. AOI', 'Actividad', 'Unidad', 'Genérica',
      'Tipo (PIA/PIM)', ...MESES, 'Total'];
    rows.push(cab);

    // Por cada actividad filtrada, una fila por genérica y tipo
    filtered.forEach(a => {
      const act = a.genericas ? a : migrarActividadGenericas(a);
      GENERICAS_GASTO.forEach(gen => {
        ['pia', 'pim'].forEach(tipo => {
          const arr = act.genericas?.[gen.codigo]?.[tipo] || Array(12).fill(0);
          const total = arr.reduce((s, v) => s + (Number(v) || 0), 0);
          if (total === 0) return; // omitir genéricas vacías
          rows.push([
            a.centroCosto, a.area || '', a.codigoAOI, a.nombre, a.unidadMedida || '',
            `${gen.codigo} ${gen.nombre}`, tipo.toUpperCase(),
            ...arr.map(v => (Number(v) || 0).toFixed(2)), total.toFixed(2),
          ]);
        });
      });
      // Fila de física
      const fis = (act.programacion || []).map(p => Number(p?.fisica) || 0);
      const totalFis = fis.reduce((s, v) => s + v, 0);
      rows.push([
        a.centroCosto, a.area || '', a.codigoAOI, a.nombre, a.unidadMedida || '',
        'META FÍSICA', 'PIM',
        ...fis.map(v => v.toFixed(0)), totalFis.toFixed(0),
      ]);
    });

    // Construir CSV con BOM para que Excel reconozca UTF-8
    const csv = '\ufeff' + rows.map(r =>
      r.map(c => {
        const s = String(c).replace(/"/g, '""');
        return /[;"\n]/.test(s) ? `"${s}"` : s;
      }).join(';')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sufijo = filtroCC === 'TODOS' ? 'TODOS' : filtroCC.replace(/\s+/g, '_');
    link.download = `Programacion_POI_${sufijo}_2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (logAuditoria) logAuditoria('exportar_programacion', `Exportó la programación POI (${sufijo}) a Excel`, {});
  }

  // Eliminar un área (con validación)
  async function handleEliminarArea(cc, area) {
    const conActividades = activities.filter(a => a.centroCosto === cc && a.area === area).length;
    if (conActividades > 0) {
      alert(`⚠️ No se puede eliminar el área "${area}" porque tiene ${conActividades} actividad${conActividades === 1 ? '' : 'es'} asociada${conActividades === 1 ? '' : 's'}.\n\nPrimero reasigne o elimine las actividades del área antes de continuar.`);
      return;
    }
    if (!window.confirm(`¿Eliminar el área "${area}" del centro de costo "${cc}"?\n\nEsta acción no afecta ninguna actividad existente.`)) return;
    const next = { ...areasMap, [cc]: (areasMap[cc] || []).filter(a => a !== area) };
    if (saveAreasPorCC) await saveAreasPorCC(next);
    if (filtroArea === area) setFiltroArea('TODAS');
    if (logAuditoria) await logAuditoria('eliminar_area', `Eliminó área "${area}" del CC ${cc}`, { centroCosto: cc, area });
  }

  // Agregar área nueva
  async function handleAgregarArea(cc, nuevaArea) {
    const nombre = String(nuevaArea || '').trim().toUpperCase();
    if (!nombre) { alert('Ingresa un nombre para el área'); return false; }
    const existentes = (areasMap[cc] || []).map(a => a.toUpperCase());
    if (existentes.includes(nombre)) { alert(`El área "${nombre}" ya existe en ${cc}`); return false; }
    const next = { ...areasMap, [cc]: [...(areasMap[cc] || []), nombre].sort() };
    if (saveAreasPorCC) await saveAreasPorCC(next);
    if (logAuditoria) await logAuditoria('crear_area', `Creó área "${nombre}" en el CC ${cc}`, { centroCosto: cc, area: nombre });
    return true;
  }

  const visibleActivities = esResponsableCC(currentUser)
    ? filtrarActividadesUsuario(activities, currentUser)
    : activities;

  // Áreas disponibles según el CC seleccionado (combina predefinidas + en uso)
  const areasDisponiblesFiltro = useMemo(() => {
    if (filtroCC === 'TODOS') return [];
    const predefinidas = areasMap[filtroCC] || [];
    const enUso = Array.from(new Set(
      visibleActivities.filter(a => a.centroCosto === filtroCC && a.area).map(a => a.area)
    ));
    return Array.from(new Set([...predefinidas, ...enUso])).sort();
  }, [filtroCC, visibleActivities, areasMap]);

  // Reset área al cambiar CC
  useEffect(() => {
    setFiltroArea('TODAS');
  }, [filtroCC]);

  const filtered = useMemo(() => {
    let r = filtroCC === 'TODOS' ? visibleActivities : visibleActivities.filter(a => a.centroCosto === filtroCC);
    if (filtroArea !== 'TODAS') r = r.filter(a => a.area === filtroArea);
    return r;
  }, [visibleActivities, filtroCC, filtroArea]);

  const canEdit = esAdmin(currentUser);

  // Mapa de actividades reprogramadas
  function getReprogsByActivityId(actId) {
    return reprogramaciones.filter(r =>
      (r.estado === 'cerrada' || r.estado === 'aprobada') &&
      r.programacionNueva &&
      r.programacionNueva.some(p => p.id === actId)
    ).sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
  }

  function newActivity() {
    setIsNew(true);
    setEditing({
      id: uid(),
      centroCosto: filtroCC === 'TODOS' ? CENTROS_COSTO[0].nombre : filtroCC,
      area: '',
      codigoRegistro: '',
      codigoAOI: '',
      nombre: '',
      unidadMedida: '',
      responsable: '',
      metaAnualFisica: 0,      // física PIA (auto-calculada)
      metaAnualFisicaPIM: 0,   // física PIM (auto-calculada)
      presupuestoAnual: 0,
      activo: true,
      piaBloqueado: false,     // nueva actividad: PIA abierto para registro inicial
      genericas: nuevasGenericas(),
      fisicaMensual: nuevaFisicaMensual(),
      programacion: Array.from({ length: 12 }, () => ({ fisica: 0, financiera: 0 })),
    });
    setShowForm(true);
  }

  function editActivity(a) {
    setEditing(JSON.parse(JSON.stringify(migrarActividadGenericas(a))));
    setIsNew(false);
    setShowForm(true);
  }

  async function toggleActiveActivity(a) {
    const next = activities.map(x => x.id === a.id ? { ...x, activo: x.activo === false ? true : false } : x);
    await saveActivities(next);
    if (logAuditoria) {
      await logAuditoria(
        a.activo === false ? 'habilitar_actividad' : 'deshabilitar_actividad',
        `${a.activo === false ? 'Habilitó' : 'Deshabilitó'} actividad ${a.codigoAOI} - ${a.nombre}`,
        { actividadId: a.id, centroCosto: a.centroCosto }
      );
    }
  }

  async function handleSave() {
    if (!editing.codigoAOI || !editing.nombre) {
      alert('Código AOI y nombre son obligatorios');
      return;
    }
    // Sincronizar el campo legado 'programacion' y totales desde las genéricas/física mensual
    const finalAct = { ...editing };
    if (finalAct.genericas) {
      // Física anual PIA/PIM se calcula automáticamente desde la física mensual
      finalAct.metaAnualFisica = totalFisicaActividad(finalAct, 'pia');
      finalAct.metaAnualFisicaPIM = totalFisicaActividad(finalAct, 'pim');
      // Sincronizar programacion[] (físico = PIM mensual, financiero = PIM mensual de genéricas)
      const prog = Array.from({ length: 12 }, (_, i) => ({
        fisica: Number(finalAct.fisicaMensual?.pim?.[i]) || 0,
        financiera: financieroMesActividad(finalAct, 'pim', i),
      }));
      finalAct.programacion = prog;
      finalAct.presupuestoAnual = totalFinancieroActividad(finalAct, 'pim');
      finalAct.presupuestoAnualPIA = totalFinancieroActividad(finalAct, 'pia');
    }
    // Al guardar, si el PIA estaba abierto y ya tiene datos, se bloquea automáticamente
    // para evitar modificaciones involuntarias posteriores.
    const tienePIA = totalFinancieroActividad(finalAct, 'pia') > 0 || totalFisicaActividad(finalAct, 'pia') > 0;
    if (finalAct.piaBloqueado !== true && tienePIA) {
      finalAct.piaBloqueado = true;
    }
    const exists = activities.find(x => x.id === finalAct.id);
    const next = exists ? activities.map(x => x.id === finalAct.id ? finalAct : x) : [...activities, finalAct];
    await saveActivities(next);
    if (logAuditoria) {
      await logAuditoria(
        exists ? 'editar_actividad' : 'crear_actividad',
        `${exists ? 'Editó' : 'Creó'} actividad ${finalAct.codigoAOI} - ${finalAct.nombre}`,
        { actividadId: finalAct.id, centroCosto: finalAct.centroCosto }
      );
    }
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id) {
    const a = activities.find(x => x.id === id);
    if (!confirm('¿Eliminar esta actividad?')) return;
    await saveActivities(activities.filter(x => x.id !== id));
    if (logAuditoria && a) {
      await logAuditoria('eliminar_actividad',
        `Eliminó actividad ${a.codigoAOI} - ${a.nombre}`,
        { actividadId: id });
    }
  }

  return (
    <>
      <PageHeader title="Programación POI" subtitle="Actividades operativas"
        action={
          <div className="flex items-center gap-2">
            <button onClick={exportarProgramacionExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
              style={{ background: '#1F7A4D', color: '#FFFFFF' }}>
              <FileSpreadsheet size={16} /> Exportar a Excel
            </button>
            {canEdit && (
              <button onClick={newActivity}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
                style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
                <Plus size={16} /> Nueva actividad
              </button>
            )}
          </div>
        } />

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} style={{ color: '#7A6F5C' }} />
          <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#7A6F5C' }}>Centro de costo:</span>
          {!esResponsableCC(currentUser) && (
            <button onClick={() => setFiltroCC('TODOS')}
              className="text-xs px-3 py-1 rounded-md font-medium"
              style={{
                background: filtroCC === 'TODOS' ? '#1E2A3A' : '#F0E9D9',
                color: filtroCC === 'TODOS' ? '#F5F1E8' : '#1E2A3A',
              }}>Todos ({visibleActivities.length})</button>
          )}
          {CENTROS_COSTO.filter(c => ccDisponibles.includes(c.nombre)).map(cc => {
            const count = visibleActivities.filter(a => a.centroCosto === cc.nombre).length;
            return (
              <button key={cc.codigo} onClick={() => setFiltroCC(cc.nombre)}
                className="text-xs px-3 py-1 rounded-md font-medium"
                style={{
                  background: filtroCC === cc.nombre ? '#1E2A3A' : '#F0E9D9',
                  color: filtroCC === cc.nombre ? '#F5F1E8' : '#1E2A3A',
                }}>
                {cc.nombre} ({count})
              </button>
            );
          })}
        </div>

        {/* Selector de Área/Unidad - se habilita solo cuando hay CC seleccionado */}
        {filtroCC !== 'TODOS' && areasDisponiblesFiltro.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap mt-3 pt-3" style={{ borderTop: '1px dashed #E5DDD0' }}>
            <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#7A6F5C' }}>Área / Unidad:</span>
            <button onClick={() => setFiltroArea('TODAS')}
              className="text-xs px-3 py-1 rounded-md font-medium"
              style={{
                background: filtroArea === 'TODAS' ? '#C9A350' : '#F0E9D9',
                color: filtroArea === 'TODAS' ? '#1E2A3A' : '#1E2A3A',
              }}>
              Todas ({visibleActivities.filter(a => a.centroCosto === filtroCC).length})
            </button>
            {areasDisponiblesFiltro.map(area => {
              const count = visibleActivities.filter(a => a.centroCosto === filtroCC && a.area === area).length;
              return (
                <div key={area} className="inline-flex items-center rounded-md overflow-hidden" style={{ background: filtroArea === area ? '#C9A350' : '#F0E9D9' }}>
                  <button onClick={() => setFiltroArea(area)}
                    className="text-xs px-3 py-1 font-medium"
                    style={{ color: '#1E2A3A' }}>
                    {area} ({count})
                  </button>
                  {canEdit && (
                    <button onClick={() => handleEliminarArea(filtroCC, area)}
                      title={`Eliminar área "${area}"`}
                      className="px-1.5 py-1 hover:bg-red-200 transition-colors"
                      style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', color: '#B33B3B' }}>
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            {canEdit && (
              <button onClick={() => setShowGestionAreas(true)}
                className="text-xs px-3 py-1 rounded-md font-medium ml-auto"
                style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
                ⚙ Gestionar áreas
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Selector de mes para ver la programación de un mes específico */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={16} style={{ color: '#7A6F5C' }} />
          <span className="text-xs uppercase tracking-wider font-medium mr-2" style={{ color: '#7A6F5C' }}>Ver mes:</span>
          <button onClick={() => setFiltroMesProg(0)}
            className="text-xs px-3 py-1.5 rounded-md font-medium"
            style={{
              background: filtroMesProg === 0 ? '#1E2A3A' : '#F0E9D9',
              color: filtroMesProg === 0 ? '#F5F1E8' : '#1E2A3A',
            }}>
            Anual (total)
          </button>
          {MESES.map((m, i) => (
            <button key={i} onClick={() => setFiltroMesProg(i + 1)}
              className="text-xs px-2.5 py-1.5 rounded-md font-medium"
              style={{
                background: filtroMesProg === i + 1 ? '#C9A350' : '#FAF7F0',
                color: '#1E2A3A',
                border: filtroMesProg === i + 1 ? '1px solid #C9A350' : '1px solid #E5DDD0',
              }}>
              {MESES_ABR[i]}
            </button>
          ))}
          {filtroMesProg > 0 && (
            <span className="text-xs ml-2 italic" style={{ color: '#9C7A2B' }}>
              Mostrando programación de <strong>{MESES[filtroMesProg - 1]}</strong>
            </span>
          )}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>CC / Área</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>AOI</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Actividad</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Unidad</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Física PIA</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Física PIM</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C', background: '#FAF7F0' }}>{filtroMesProg > 0 ? `Fin. PIA ${MESES_ABR[filtroMesProg-1]}` : 'Financiera PIA'}</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#9C7A2B', background: '#FBF1D9' }}>{filtroMesProg > 0 ? `Fin. PIM ${MESES_ABR[filtroMesProg-1]}` : 'Financiera PIM'}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-sm" style={{ color: '#7A6F5C' }}>
                  Sin actividades en este filtro.
                </td></tr>
              )}
              {filtered.map((a) => {
                const inactivo = a.activo === false;
                const finPIA = filtroMesProg > 0 ? financieroMesActividad(a, 'pia', filtroMesProg - 1) : totalFinancieroActividad(a, 'pia');
                const finPIM = filtroMesProg > 0 ? financieroMesActividad(a, 'pim', filtroMesProg - 1) : totalFinancieroActividad(a, 'pim');
                return (
                <tr key={a.id} className="border-b last:border-b-0 hover:bg-stone-50" style={{ borderColor: '#E5DDD0', opacity: inactivo ? 0.55 : 1 }}>
                  <td className="px-4 py-3">
                    <Pill>{a.centroCosto}</Pill>
                    <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>{a.area}</div>
                    {inactivo && (
                      <span className="inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded font-semibold" style={{ background: '#F5D5D5', color: '#B33B3B' }}>
                        DESHABILITADA
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#1E2A3A' }}>
                    <div className="flex items-center gap-2">
                      {a.codigoAOI}
                      {(() => {
                        const reprogs = getReprogsByActivityId(a.id);
                        if (reprogs.length === 0) return null;
                        return (
                          <button onClick={() => setVerHistorial({ actividad: a, reprogs })}
                            title={`Reprogramada ${reprogs.length} ${reprogs.length === 1 ? 'vez' : 'veces'}`}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: '#FBE0D0', color: '#A85D2B', fontSize: 10 }}>
                            <RefreshCw size={10} /> {reprogs.length}
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#1E2A3A' }}>
                    <div className="text-xs leading-snug" style={{ maxWidth: 380 }}>{a.nombre}</div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>{a.unidadMedida}</td>
                  <td className="px-4 py-3 text-right" style={{ color: '#1E2A3A' }}>{fmtEntero(a.metaAnualFisica)}</td>
                  <td className="px-4 py-3 text-right" style={{ color: '#1E2A3A' }}>{fmtEntero(a.metaAnualFisicaPIM || a.metaAnualFisica)}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: '#1E2A3A', background: '#FAF7F0' }}>{fmtEntero(finPIA)}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: '#9C7A2B', background: '#FBF1D9' }}>{fmtEntero(finPIM)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {canEdit ? (
                      <>
                        <button onClick={() => toggleActiveActivity(a)}
                          className="p-1.5 rounded hover:bg-stone-200 mr-1"
                          title={inactivo ? 'Habilitar actividad' : 'Deshabilitar actividad'}
                          style={{ color: inactivo ? '#2D7A4E' : '#9C7A2B' }}>
                          {inactivo ? '🔓' : '🔒'}
                        </button>
                        <button onClick={() => editActivity(a)} className="p-1.5 rounded hover:bg-stone-200 mr-1" title="Editar">
                          <Edit3 size={14} style={{ color: '#1E2A3A' }} />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-red-50" title="Eliminar">
                          <Trash2 size={14} style={{ color: '#B33B3B' }} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: '#9C9080' }}>—</span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: '#1E2A3A', color: '#F5F1E8', fontWeight: 600 }}>
                  <td className="px-4 py-3 text-xs uppercase tracking-wider" colSpan={4}>TOTAL PROGRAMADO ({filtered.length} actividades)</td>
                  <td className="px-4 py-3 text-right text-xs">{fmtEntero(filtered.reduce((s, a) => s + (Number(a.metaAnualFisica) || 0), 0))}</td>
                  <td className="px-4 py-3 text-right text-xs">{fmtEntero(filtered.reduce((s, a) => s + (Number(a.metaAnualFisicaPIM || a.metaAnualFisica) || 0), 0))}</td>
                  <td className="px-4 py-3 text-right text-xs">{fmtEntero(filtered.reduce((s, a) => s + (filtroMesProg > 0 ? financieroMesActividad(a, 'pia', filtroMesProg - 1) : totalFinancieroActividad(a, 'pia')), 0))}</td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: '#C9A350' }}>{fmtEntero(filtered.reduce((s, a) => s + (filtroMesProg > 0 ? financieroMesActividad(a, 'pim', filtroMesProg - 1) : totalFinancieroActividad(a, 'pim')), 0))}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {showForm && editing && (
        <ActivityForm activity={editing} setActivity={setEditing} isNew={isNew}
          activities={activities}
          areasMap={areasMap}
          onAgregarArea={handleAgregarArea}
          onEliminarArea={handleEliminarArea}
          canEdit={canEdit}
          onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}

      {verHistorial && (
        <HistorialReprogModal
          actividad={verHistorial.actividad}
          reprogs={verHistorial.reprogs}
          onClose={() => setVerHistorial(null)}
        />
      )}

      {showGestionAreas && (
        <GestionAreasModal
          areasMap={areasMap}
          activities={activities}
          onAgregarArea={handleAgregarArea}
          onEliminarArea={handleEliminarArea}
          onClose={() => setShowGestionAreas(false)}
        />
      )}
    </>
  );
}

function ActivityForm({ activity, setActivity, isNew, onSave, onClose, activities = [], areasMap, onAgregarArea, onEliminarArea, canEdit = false }) {
  // Asegurar estructura de genéricas y física mensual
  const act = (activity.genericas && activity.fisicaMensual) ? activity : migrarActividadGenericas(activity);
  if (!activity.genericas || !activity.fisicaMensual) {
    setTimeout(() => setActivity(act), 0);
  }

  const piaBloqueado = activity.piaBloqueado === true;

  function update(field, value) { setActivity({ ...activity, [field]: value }); }

  // Actualizar genérica financiera: si es PIA y está bloqueado, no permite
  function updateGenerica(gen, tipo, mesIdx, value) {
    if (tipo === 'pia' && piaBloqueado) return;
    const genericas = JSON.parse(JSON.stringify(activity.genericas || nuevasGenericas()));
    if (!genericas[gen]) genericas[gen] = { pia: Array(12).fill(0), pim: Array(12).fill(0) };
    genericas[gen][tipo][mesIdx] = Number(value) || 0;
    setActivity({ ...activity, genericas });
  }

  // Actualizar física mensual: si es PIA y está bloqueado, no permite
  function updateFisicaMensual(tipo, mesIdx, value) {
    if (tipo === 'pia' && piaBloqueado) return;
    const fm = JSON.parse(JSON.stringify(activity.fisicaMensual || nuevaFisicaMensual()));
    fm[tipo][mesIdx] = Number(value) || 0;
    setActivity({ ...activity, fisicaMensual: fm });
  }

  // Totales por tipo (auto-calculados, no editables)
  const sumFinPIA = totalFinancieroActividad(activity, 'pia');
  const sumFinPIM = totalFinancieroActividad(activity, 'pim');
  const sumFisPIA = totalFisicaActividad(activity, 'pia');
  const sumFisPIM = totalFisicaActividad(activity, 'pim');

  // Mapa efectivo de áreas (dinámico si fue pasado por props)
  const _areasMap = areasMap || AREAS_POR_CC;

  // Áreas disponibles para el CC seleccionado: combina predefinidas dinámicas
  // con las áreas existentes en actividades de ese CC (para mostrar todas las usadas)
  const areasDisponibles = useMemo(() => {
    const predefinidas = _areasMap[activity.centroCosto] || [];
    const enUso = Array.from(new Set(
      activities.filter(a => a.centroCosto === activity.centroCosto && a.area).map(a => a.area)
    ));
    return Array.from(new Set([...predefinidas, ...enUso])).sort();
  }, [activity.centroCosto, activities, _areasMap]);

  // Responsables existentes (en todas las actividades, deduplicados)
  const responsablesExistentes = useMemo(() => {
    return Array.from(new Set(
      activities.filter(a => a.responsable && a.responsable.trim()).map(a => a.responsable.trim())
    )).sort();
  }, [activities]);

  const [modoArea, setModoArea] = useState('select'); // 'select' | 'nuevo'
  const [modoResp, setModoResp] = useState('select'); // 'select' | 'nuevo'
  const [nuevaAreaInput, setNuevaAreaInput] = useState('');

  // Cuando cambia el CC, resetea el área si no está en la lista del nuevo CC
  function cambiarCC(nuevoCC) {
    const nuevasAreas = _areasMap[nuevoCC] || [];
    const enUso = Array.from(new Set(
      activities.filter(a => a.centroCosto === nuevoCC && a.area).map(a => a.area)
    ));
    const todas = Array.from(new Set([...nuevasAreas, ...enUso]));
    setActivity({
      ...activity,
      centroCosto: nuevoCC,
      area: todas.includes(activity.area) ? activity.area : (todas[0] || ''),
    });
    setModoArea('select');
  }

  async function guardarNuevaArea() {
    if (!onAgregarArea) {
      // Modo fallback: solo establecer en la actividad sin persistir
      if (nuevaAreaInput.trim()) update('area', nuevaAreaInput.trim().toUpperCase());
      setModoArea('select');
      return;
    }
    const ok = await onAgregarArea(activity.centroCosto, nuevaAreaInput);
    if (ok) {
      update('area', nuevaAreaInput.trim().toUpperCase());
      setNuevaAreaInput('');
      setModoArea('select');
    }
  }

  async function eliminarAreaActual() {
    if (!activity.area || !onEliminarArea) return;
    await onEliminarArea(activity.centroCosto, activity.area);
    // Si el área se eliminó exitosamente, limpiar el campo
    const conActividades = activities.filter(a => a.centroCosto === activity.centroCosto && a.area === activity.area).length;
    if (conActividades === 0 || (conActividades === 1 && !isNew && activity.id)) {
      // No-op: la advertencia ya la dio onEliminarArea
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ background: '#FAF7F0', borderColor: '#E5DDD0' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
            {isNew ? 'Nueva actividad operativa' : 'Editar actividad'}
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <Field label="Centro de Costo">
            <select value={activity.centroCosto} onChange={(e) => cambiarCC(e.target.value)} className={inputCls}>
              {CENTROS_COSTO.map(cc => <option key={cc.codigo} value={cc.nombre}>{cc.nombre}</option>)}
            </select>
          </Field>
          <Field label="Área / Unidad">
            {modoArea === 'select' ? (
              <div className="flex gap-1">
                <select value={activity.area} onChange={(e) => update('area', e.target.value)} className={inputCls} style={{ flex: 1 }}>
                  <option value="">— Selecciona un área —</option>
                  {areasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button type="button" onClick={() => { setModoArea('nuevo'); setNuevaAreaInput(''); update('area', ''); }}
                  className="px-2.5 rounded-md text-xs font-semibold whitespace-nowrap"
                  style={{ background: '#C9A350', color: '#1E2A3A' }} title="Crear nueva área/unidad">
                  + Nueva
                </button>
                {canEdit && activity.area && onEliminarArea && (
                  <button type="button" onClick={eliminarAreaActual}
                    className="px-2.5 rounded-md text-xs font-semibold whitespace-nowrap"
                    style={{ background: '#F5D5D5', color: '#B33B3B' }}
                    title={`Eliminar área "${activity.area}"`}>
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-1">
                <input type="text" value={nuevaAreaInput} onChange={(e) => setNuevaAreaInput(e.target.value.toUpperCase())}
                  placeholder="Nombre de la nueva área/unidad" className={inputCls} style={{ flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); guardarNuevaArea(); } }} />
                <button type="button" onClick={guardarNuevaArea}
                  disabled={!nuevaAreaInput.trim()}
                  className="px-2.5 rounded-md text-xs font-semibold whitespace-nowrap"
                  style={{ background: '#2D7A4E', color: '#FFF', opacity: nuevaAreaInput.trim() ? 1 : 0.5 }}>
                  ✓ Guardar
                </button>
                <button type="button" onClick={() => { setModoArea('select'); setNuevaAreaInput(''); }}
                  className="px-2.5 rounded-md text-xs font-semibold"
                  style={{ background: '#F0E9D9', color: '#1E2A3A' }} title="Cancelar">
                  ←
                </button>
              </div>
            )}
          </Field>
          <Field label="Código de Registro">
            <input type="text" value={activity.codigoRegistro} onChange={(e) => update('codigoRegistro', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Código AOI">
            <input type="text" value={activity.codigoAOI} onChange={(e) => update('codigoAOI', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Nombre de la actividad" full>
            <textarea rows={2} value={activity.nombre} onChange={(e) => update('nombre', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Unidad de medida">
            <input type="text" value={activity.unidadMedida} onChange={(e) => update('unidadMedida', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Responsable">
            {modoResp === 'select' ? (
              <div className="flex gap-2">
                <select value={activity.responsable} onChange={(e) => update('responsable', e.target.value)} className={inputCls} style={{ flex: 1 }}>
                  <option value="">— Selecciona un responsable —</option>
                  {responsablesExistentes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button type="button" onClick={() => { setModoResp('nuevo'); update('responsable', ''); }}
                  className="px-2.5 rounded-md text-xs font-semibold whitespace-nowrap"
                  style={{ background: '#C9A350', color: '#1E2A3A' }} title="Agregar nuevo responsable">
                  + Nuevo
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={activity.responsable} onChange={(e) => update('responsable', e.target.value)}
                  placeholder="Nombre del responsable" className={inputCls} style={{ flex: 1 }} />
                <button type="button" onClick={() => setModoResp('select')}
                  className="px-2.5 rounded-md text-xs font-semibold"
                  style={{ background: '#F0E9D9', color: '#1E2A3A' }} title="Volver a seleccionar">
                  ← Lista
                </button>
              </div>
            )}
          </Field>
          <Field label="Física anual PIA (auto)">
            <input type="number" value={sumFisPIA} readOnly className={inputCls} style={{ background: '#F0E9D9', cursor: 'not-allowed' }} />
          </Field>
          <Field label="Física anual PIM (auto)">
            <input type="number" value={sumFisPIM} readOnly className={inputCls} style={{ background: '#FBF1D9', cursor: 'not-allowed', color: '#9C7A2B' }} />
          </Field>
        </div>

        {/* Banner de estado del PIA */}
        <div className="px-6 pb-3">
          {piaBloqueado ? (
            <div className="p-3 rounded flex items-center justify-between" style={{ background: '#FBF1D9', border: '1px solid #C9A350' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#9C7A2B' }}>
                <Lock size={14} />
                <span><strong>PIA bloqueado.</strong> La programación PIA (física y financiera) se registra una sola vez al año (enero) y no puede modificarse. Para cambios, solicite apertura.</span>
              </div>
              <button type="button"
                onClick={() => {
                  if (window.confirm('¿Solicitar apertura del PIA para esta actividad?\n\nEsto registrará una solicitud que debe ser aprobada por un administrador antes de poder editar el PIA.')) {
                    alert('Solicitud de apertura registrada. Un administrador debe aprobarla en el módulo de Solicitudes.\n\n(Nota: en esta demo, un administrador puede desbloquear directamente con el botón "Desbloquear PIA".)');
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-md font-semibold whitespace-nowrap"
                style={{ background: '#C9A350', color: '#1E2A3A' }}>
                <Unlock size={12} className="inline mr-1" /> Solicitar apertura
              </button>
            </div>
          ) : (
            <div className="p-3 rounded flex items-center justify-between" style={{ background: '#E8F2EC', border: '1px solid #2D7A4E' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#2D7A4E' }}>
                <Unlock size={14} />
                <span><strong>PIA abierto.</strong> Puede registrar la programación PIA inicial. Una vez guardada quedará bloqueada para evitar modificaciones involuntarias.</span>
              </div>
            </div>
          )}
          {/* El administrador puede bloquear/desbloquear manualmente (demo) */}
          {canEdit && (
            <div className="mt-2 flex justify-end">
              <button type="button"
                onClick={() => update('piaBloqueado', !piaBloqueado)}
                className="text-[11px] px-2.5 py-1 rounded font-medium"
                style={{ background: piaBloqueado ? '#E8F2EC' : '#FBF1D9', color: piaBloqueado ? '#2D7A4E' : '#9C7A2B' }}>
                {piaBloqueado ? '🔓 Desbloquear PIA (admin)' : '🔒 Bloquear PIA (admin)'}
              </button>
            </div>
          )}
        </div>

        {/* Resumen de totales financieros (calculados) */}
        <div className="px-6 pb-2 grid grid-cols-2 gap-4">
          <div className="p-3 rounded" style={{ background: '#FAF7F0', border: '1px solid #E5DDD0' }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Financiera anual PIA (auto)</div>
            <div className="text-lg font-bold" style={{ color: '#1E2A3A' }}>S/ {fmtDecimal(sumFinPIA)}</div>
          </div>
          <div className="p-3 rounded" style={{ background: '#FBF1D9', border: '1px solid #C9A350' }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9C7A2B' }}>Financiera anual PIM (auto)</div>
            <div className="text-lg font-bold" style={{ color: '#9C7A2B' }}>S/ {fmtDecimal(sumFinPIM)}</div>
          </div>
        </div>

        {/* Programación física mensual PIA y PIM */}
        <div className="px-6 pb-2">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9C7A2B' }}>Programación física mensual</div>
          <div className="text-[11px] mb-3" style={{ color: '#7A6F5C' }}>La fila PIA es la programación original (se bloquea tras el registro inicial). La fila PIM es la vigente y se modifica con las reprogramaciones.</div>
        </div>
        <div className="px-6 pb-4">
          <div className="overflow-x-auto rounded-md border" style={{ borderColor: '#E5DDD0' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F0E9D9' }}>
                  <th className="text-left px-2 py-2 text-[10px] uppercase" style={{ color: '#7A6F5C' }}>Tipo</th>
                  {MESES_ABR.map((m, i) => (
                    <th key={i} className="text-center px-1 py-2 text-[10px] uppercase" style={{ color: '#7A6F5C' }}>{m}</th>
                  ))}
                  <th className="text-center px-2 py-2 text-[10px] uppercase" style={{ color: '#1E2A3A', background: '#E5DDD0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1 text-[11px] font-semibold" style={{ color: '#7A6F5C' }}>PIA</td>
                  {MESES.map((m, i) => (
                    <td key={i} className="px-0.5 py-1">
                      <input type="number" value={activity.fisicaMensual?.pia?.[i] ?? 0}
                        onChange={(e) => updateFisicaMensual('pia', i, e.target.value)}
                        readOnly={piaBloqueado}
                        className="w-full text-right px-1 py-1 rounded border text-[11px]"
                        style={{ borderColor: '#E5DDD0', background: piaBloqueado ? '#F0E9D9' : '#FFF', cursor: piaBloqueado ? 'not-allowed' : 'text' }} />
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right text-[11px] font-bold" style={{ color: '#1E2A3A', background: '#FAF7F0' }}>{fmtEntero(sumFisPIA)}</td>
                </tr>
                <tr>
                  <td className="px-2 py-1 text-[11px] font-semibold" style={{ color: '#9C7A2B' }}>PIM</td>
                  {MESES.map((m, i) => (
                    <td key={i} className="px-0.5 py-1">
                      <input type="number" value={activity.fisicaMensual?.pim?.[i] ?? 0}
                        onChange={(e) => updateFisicaMensual('pim', i, e.target.value)}
                        className="w-full text-right px-1 py-1 rounded border text-[11px]"
                        style={{ borderColor: '#C9A350', background: '#FFFDF7' }} />
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right text-[11px] font-bold" style={{ color: '#9C7A2B', background: '#FBF1D9' }}>{fmtEntero(sumFisPIM)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Programación financiera por genérica de gasto */}
        <div className="px-6 pb-2">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9C7A2B' }}>Programación financiera por genérica de gasto</div>
          <div className="text-[11px] mb-3" style={{ color: '#7A6F5C' }}>Ingresa los importes con decimales. La fila PIA se bloquea tras el registro inicial; la fila PIM es modificable.</div>
        </div>
        <div className="px-6 pb-4 space-y-4">
          {GENERICAS_GASTO.map(gen => {
            const totPIA = (activity.genericas?.[gen.codigo]?.pia || []).reduce((s, v) => s + (Number(v) || 0), 0);
            const totPIM = (activity.genericas?.[gen.codigo]?.pim || []).reduce((s, v) => s + (Number(v) || 0), 0);
            return (
              <div key={gen.codigo} className="rounded-md border" style={{ borderColor: '#E5DDD0' }}>
                <div className="px-3 py-2 flex items-center justify-between" style={{ background: '#1E2A3A' }}>
                  <span className="text-xs font-semibold" style={{ color: '#C9A350' }}>{gen.codigo} {gen.nombre}</span>
                  <span className="text-[11px]" style={{ color: '#F5F1E8' }}>
                    PIA: S/ {fmtDecimal(totPIA)} &nbsp;|&nbsp; PIM: S/ {fmtDecimal(totPIM)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: '#F0E9D9' }}>
                        <th className="text-left px-2 py-1.5 text-[10px] uppercase" style={{ color: '#7A6F5C' }}>Tipo</th>
                        {MESES_ABR.map((m, i) => <th key={i} className="text-center px-1 py-1.5 text-[10px]" style={{ color: '#7A6F5C' }}>{m}</th>)}
                        <th className="text-center px-2 py-1.5 text-[10px] uppercase" style={{ color: '#1E2A3A', background: '#E5DDD0' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-2 py-1 text-[11px] font-semibold" style={{ color: '#7A6F5C' }}>PIA</td>
                        {MESES.map((m, i) => (
                          <td key={i} className="px-0.5 py-1">
                            <input type="number" step="0.01" value={activity.genericas?.[gen.codigo]?.pia?.[i] ?? 0}
                              onChange={(e) => updateGenerica(gen.codigo, 'pia', i, e.target.value)}
                              readOnly={piaBloqueado}
                              className="w-full text-right px-1 py-1 rounded border text-[11px]"
                              style={{ borderColor: '#E5DDD0', background: piaBloqueado ? '#F0E9D9' : '#FFF', cursor: piaBloqueado ? 'not-allowed' : 'text' }} />
                          </td>
                        ))}
                        <td className="px-2 py-1 text-right text-[11px] font-bold" style={{ color: '#1E2A3A', background: '#FAF7F0' }}>{fmtEntero(totPIA)}</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 text-[11px] font-semibold" style={{ color: '#9C7A2B' }}>PIM</td>
                        {MESES.map((m, i) => (
                          <td key={i} className="px-0.5 py-1">
                            <input type="number" step="0.01" value={activity.genericas?.[gen.codigo]?.pim?.[i] ?? 0}
                              onChange={(e) => updateGenerica(gen.codigo, 'pim', i, e.target.value)}
                              className="w-full text-right px-1 py-1 rounded border text-[11px]" style={{ borderColor: '#C9A350', background: '#FFFDF7' }} />
                          </td>
                        ))}
                        <td className="px-2 py-1 text-right text-[11px] font-bold" style={{ color: '#9C7A2B', background: '#FBF1D9' }}>{fmtEntero(totPIM)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Totales generales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded flex items-center justify-between" style={{ background: '#1E2A3A' }}>
              <span className="text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Total PIA</span>
              <strong style={{ color: '#F5F1E8', fontSize: 15 }}>S/ {fmtDecimal(sumFinPIA)}</strong>
            </div>
            <div className="p-3 rounded flex items-center justify-between" style={{ background: '#9C7A2B' }}>
              <span className="text-xs uppercase tracking-wider" style={{ color: '#FBF1D9' }}>Total PIM</span>
              <strong style={{ color: '#FFFFFF', fontSize: 15 }}>S/ {fmtDecimal(sumFinPIM)}</strong>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2 sticky bottom-0" style={{ background: '#FAF7F0', borderColor: '#E5DDD0' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cancelar</button>
          <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold" style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
            <Save size={14} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function GestionAreasModal({ areasMap, activities, onAgregarArea, onEliminarArea, onClose }) {
  const [ccSelected, setCcSelected] = useState(CENTROS_COSTO[0].nombre);
  const [nuevaArea, setNuevaArea] = useState('');

  // Áreas del CC seleccionado (predefinidas + en uso)
  const areasDelCC = useMemo(() => {
    const predefinidas = areasMap[ccSelected] || [];
    const enUso = Array.from(new Set(activities.filter(a => a.centroCosto === ccSelected && a.area).map(a => a.area)));
    return Array.from(new Set([...predefinidas, ...enUso])).sort();
  }, [ccSelected, areasMap, activities]);

  async function agregar() {
    const ok = await onAgregarArea(ccSelected, nuevaArea);
    if (ok) setNuevaArea('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ background: '#FAF7F0', borderColor: '#E5DDD0' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
            ⚙ Gestión de Áreas / Unidades
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-3 rounded text-xs" style={{ background: '#FBF1D9', borderLeft: '3px solid #C9A350', color: '#9C7A2B' }}>
            <strong>ℹ️ Importante:</strong> No se puede eliminar un área si tiene actividades asociadas.
            Primero reasigne o elimine las actividades del área antes de continuar.
            Los cambios se reflejan en todos los módulos del sistema.
          </div>

          {/* Selector de CC */}
          <Field label="Centro de Costo">
            <select value={ccSelected} onChange={(e) => setCcSelected(e.target.value)} className={inputCls}>
              {CENTROS_COSTO.map(cc => <option key={cc.codigo} value={cc.nombre}>{cc.codigo} — {cc.nombre}</option>)}
            </select>
          </Field>

          {/* Agregar nueva área */}
          <div className="mt-4">
            <label className="text-[11px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: '#7A6F5C' }}>
              Agregar nueva área en {ccSelected}
            </label>
            <div className="flex gap-2">
              <input type="text" value={nuevaArea} onChange={(e) => setNuevaArea(e.target.value.toUpperCase())}
                placeholder="Nombre de la nueva área (ej: PIP CUSCO)"
                className={inputCls} style={{ flex: 1 }}
                onKeyDown={(e) => { if (e.key === 'Enter') agregar(); }} />
              <button onClick={agregar}
                disabled={!nuevaArea.trim()}
                className="px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: '#C9A350', color: '#1E2A3A', opacity: nuevaArea.trim() ? 1 : 0.5 }}>
                + Agregar
              </button>
            </div>
          </div>

          {/* Lista de áreas existentes */}
          <div className="mt-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#7A6F5C' }}>
              Áreas existentes en {ccSelected} ({areasDelCC.length})
            </div>
            {areasDelCC.length === 0 ? (
              <div className="p-4 text-center text-sm rounded" style={{ background: '#F0E9D9', color: '#7A6F5C' }}>
                No hay áreas registradas en este Centro de Costo.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
                    <th className="p-3 text-left">Área / Unidad</th>
                    <th className="p-3 text-right">Actividades asociadas</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {areasDelCC.map(area => {
                    const count = activities.filter(a => a.centroCosto === ccSelected && a.area === area).length;
                    return (
                      <tr key={area} style={{ borderBottom: '1px solid #E5DDD0', background: '#FFFFFF' }}>
                        <td className="p-3 font-medium" style={{ color: '#1E2A3A' }}>{area}</td>
                        <td className="p-3 text-right" style={{ color: count > 0 ? '#2D7A4E' : '#9C9080' }}>
                          {count > 0 ? <strong>{count} activ{count === 1 ? 'idad' : 'idades'}</strong> : 'Sin actividades'}
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => onEliminarArea(ccSelected, area)}
                            className="px-3 py-1 rounded-md text-xs font-semibold"
                            style={{
                              background: count > 0 ? '#F5D5D5' : '#FFCDCD',
                              color: '#B33B3B',
                              opacity: count > 0 ? 0.5 : 1,
                              cursor: count > 0 ? 'not-allowed' : 'pointer',
                            }}
                            title={count > 0 ? `No se puede eliminar: tiene ${count} actividad${count === 1 ? '' : 'es'}` : 'Eliminar área'}>
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end" style={{ borderColor: '#E5DDD0' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-semibold"
            style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function HistorialReprogModal({ actividad, reprogs, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ background: '#FAF7F0', borderColor: '#E5DDD0' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
              Historial de reprogramaciones
            </div>
            <div className="text-xs mt-1 font-mono" style={{ color: '#7A6F5C' }}>
              {actividad.codigoAOI} · {actividad.nombre}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-6">
          {reprogs.map((r, idx) => {
            const original = r.programacionOriginal?.find(p => p.id === actividad.id);
            const nueva = r.programacionNueva?.find(p => p.id === actividad.id);
            const mesesAfect = r.mesesAfectados || [];
            return (
              <div key={r.id} className="border rounded-md p-4" style={{ borderColor: '#E5DDD0' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#9C7A2B' }}>
                      Reprogramación #{reprogs.length - idx}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: '#1E2A3A' }}>
                      {r.solicitante} · {r.fechaSolicitud.slice(0, 10)}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
                      Meses modificados: {mesesAfect.map(m => MESES[m-1]).join(', ')}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded font-semibold" style={{ background: '#E0E5EC', color: '#5C6B7F' }}>
                    {r.estado === 'cerrada' ? 'Cerrada' : 'Aprobada'}
                  </span>
                </div>
                <div className="mb-3 text-xs leading-relaxed" style={{ color: '#1E2A3A' }}>
                  <strong>Sustento:</strong> {r.sustento}
                </div>
                {original && nueva && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: '#F0E9D9' }}>
                          <th className="text-left px-2 py-1.5" style={{ color: '#7A6F5C' }}>Concepto</th>
                          {MESES.map((m, i) => (
                            <th key={i} className="text-right px-2 py-1.5"
                              style={{ color: mesesAfect.includes(i+1) ? '#A85D2B' : '#7A6F5C' }}>
                              {m.slice(0, 3)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                          <td className="px-2 py-1.5 font-semibold" style={{ color: '#1E2A3A' }}>Física antes</td>
                          {original.programacion.map((p, i) => (
                            <td key={i} className="text-right px-2 py-1.5"
                              style={{ color: '#7A6F5C',
                                background: mesesAfect.includes(i+1) ? '#FBF1D9' : 'transparent' }}>
                              {p.fisica}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                          <td className="px-2 py-1.5 font-semibold" style={{ color: '#A85D2B' }}>Física después</td>
                          {nueva.programacion.map((p, i) => (
                            <td key={i} className="text-right px-2 py-1.5 font-semibold"
                              style={{ color: mesesAfect.includes(i+1) ? '#A85D2B' : '#1E2A3A',
                                background: mesesAfect.includes(i+1) ? '#FBE0D0' : 'transparent' }}>
                              {p.fisica}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                          <td className="px-2 py-1.5 font-semibold" style={{ color: '#1E2A3A' }}>Financiera antes</td>
                          {original.programacion.map((p, i) => (
                            <td key={i} className="text-right px-2 py-1.5"
                              style={{ color: '#7A6F5C',
                                background: mesesAfect.includes(i+1) ? '#FBF1D9' : 'transparent' }}>
                              {fmtMoneyShort(p.financiera)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5 font-semibold" style={{ color: '#A85D2B' }}>Financiera después</td>
                          {nueva.programacion.map((p, i) => (
                            <td key={i} className="text-right px-2 py-1.5 font-semibold"
                              style={{ color: mesesAfect.includes(i+1) ? '#A85D2B' : '#1E2A3A',
                                background: mesesAfect.includes(i+1) ? '#FBE0D0' : 'transparent' }}>
                              {fmtMoneyShort(p.financiera)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-end" style={{ borderColor: '#E5DDD0' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SEGUIMIENTO MENSUAL
   Centro de Costo -> Área -> Actividad operativa
============================================================ */
function Seguimiento({ activities, progress, saveProgress, periodos, solicitudes, saveSolicitudes, currentUser, usuarios, logAuditoria, notificar }) {
  const ccDisponibles = ccsVisibles(currentUser);
  const [ccSel, setCcSel] = useState(ccDisponibles[0] || CENTROS_COSTO[0].nombre);
  const [areaSel, setAreaSel] = useState('');
  const [actId, setActId] = useState('');
  const anioActualSistema = Math.max(2026, new Date().getFullYear());
  const [year, setYear] = useState(anioActualSistema <= ANIO_FINAL ? anioActualSistema : 2026);
  const [mes, setMes] = useState(3);
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);

  // Estado del periodo seleccionado
  const periodoInfo = getEstadoPeriodo(periodos, year, mes);
  const bloqueado = periodoInfo.estado === 'cerrado' || periodoInfo.estado === 'por_abrir';
  const lector = esLector(currentUser);

  // Exportar el seguimiento a Excel (CSV compatible con Excel)
  function exportarSeguimientoExcel() {
    // Actividades visibles para el usuario (respeta permisos)
    const actsExport = esResponsableCC(currentUser)
      ? filtrarActividadesUsuario(activities, currentUser)
      : activities;

    const rows = [];
    rows.push(['CC', 'Área', 'Cód. AOI', 'Actividad', 'Unidad', 'Año', 'Mes',
      'Físico programado', 'Físico ejecutado', '% Físico',
      'Financiero programado', 'Financiero ejecutado', '% Financiero',
      'Logros', 'Limitaciones', 'Medidas adoptadas']);

    actsExport.forEach(a => {
      const act = a.genericas ? a : migrarActividadGenericas(a);
      for (let m = 1; m <= 12; m++) {
        const reg = progress.find(p => p.actividadId === a.id && p.anio === year && p.mes === m);
        // Solo exportar meses con registro o con programación
        const progFis = Number(a.programacion?.[m-1]?.fisica) || 0;
        const progFin = financieroMesActividad(act, 'pim', m - 1);
        if (!reg && progFis === 0 && progFin === 0) continue;
        const ejecFis = reg ? Number(reg.avanceFisico) || 0 : 0;
        const ejecFin = reg ? Number(reg.avanceFinanciero) || 0 : 0;
        rows.push([
          a.centroCosto, a.area || '', a.codigoAOI, a.nombre, a.unidadMedida || '',
          year, MESES[m-1],
          progFis.toFixed(0), ejecFis.toFixed(0), progFis > 0 ? ((ejecFis/progFis)*100).toFixed(1)+'%' : '0%',
          progFin.toFixed(2), ejecFin.toFixed(2), progFin > 0 ? ((ejecFin/progFin)*100).toFixed(1)+'%' : '0%',
          reg?.logros || '', reg?.limitaciones || '', reg?.medidas || '',
        ]);
      }
    });

    const csv = '\ufeff' + rows.map(r =>
      r.map(c => {
        const s = String(c).replace(/"/g, '""');
        return /[;"\n]/.test(s) ? `"${s}"` : s;
      }).join(';')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Seguimiento_POI_${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (logAuditoria) logAuditoria('exportar_seguimiento', `Exportó el seguimiento POI ${year} a Excel`, {});
  }

  // Áreas del CC seleccionado, filtradas por las áreas permitidas al usuario
  // Solo considera actividades activas
  const areas = useMemo(() => {
    const areasUsuario = expandirAreasUsuario(currentUser);
    const set = new Set();
    activities.filter(a => a.centroCosto === ccSel && a.activo !== false).forEach(a => {
      // Si el usuario tiene áreas restringidas y es responsable_cc, solo mostrar esas
      if (esResponsableCC(currentUser) && areasUsuario && !areasUsuario.includes(a.area)) return;
      set.add(a.area);
    });
    return Array.from(set);
  }, [activities, ccSel, currentUser]);

  // Actividades del CC + Área, también filtradas por permisos
  // EXCLUYE actividades deshabilitadas (activo === false)
  const actsFiltered = useMemo(() => {
    return activities.filter(a => {
      if (a.activo === false) return false;
      if (a.centroCosto !== ccSel) return false;
      if (areaSel && a.area !== areaSel) return false;
      if (esResponsableCC(currentUser) && !puedeAccederActividad(currentUser, a)) return false;
      return true;
    });
  }, [activities, ccSel, areaSel, currentUser]);

  // Resetear área cuando cambia CC
  useEffect(() => {
    if (areas.length > 0 && !areas.includes(areaSel)) {
      setAreaSel(areas[0]);
    }
  }, [areas]);

  // Resetear actividad cuando cambia área
  useEffect(() => {
    if (actsFiltered.length > 0 && !actsFiltered.find(a => a.id === actId)) {
      setActId(actsFiltered[0].id);
    }
  }, [actsFiltered]);

  const activity = activities.find(a => a.id === actId);
  const existing = progress.find(p => p.actividadId === actId && p.anio === year && p.mes === mes);

  const [form, setForm] = useState(blank());
  function blank() {
    return { avanceFisico: 0, avanceFinanciero: 0, logros: '', limitaciones: '', medidas: '' };
  }

  useEffect(() => {
    if (existing) {
      setForm({
        avanceFisico: existing.avanceFisico,
        avanceFinanciero: existing.avanceFinanciero,
        logros: existing.logros || '',
        limitaciones: existing.limitaciones || '',
        medidas: existing.medidas || '',
      });
    } else {
      setForm(blank());
    }
  }, [actId, year, mes, progress.length]);

  if (activities.length === 0) {
    return (
      <>
        <PageHeader title="Seguimiento mensual" subtitle="Registro de avances" />
        <Card className="p-12 text-center">
          <AlertCircle size={28} className="mx-auto mb-3" style={{ color: '#9C7A2B' }} />
          <div className="text-sm" style={{ color: '#1E2A3A' }}>Primero crea actividades en Programación.</div>
        </Card>
      </>
    );
  }

  async function handleSave() {
    if (!activity) return;
    if (bloqueado) {
      alert('El periodo está cerrado. Solicita la apertura al administrador.');
      return;
    }
    const entry = {
      id: existing?.id || uid(),
      actividadId: actId,
      anio: Number(year),
      mes: Number(mes),
      avanceFisico: Number(form.avanceFisico) || 0,
      avanceFinanciero: Number(form.avanceFinanciero) || 0,
      logros: form.logros,
      limitaciones: form.limitaciones,
      medidas: form.medidas,
      fechaRegistro: new Date().toISOString(),
    };
    const next = existing ? progress.map(p => p.id === existing.id ? entry : p) : [...progress, entry];
    await saveProgress(next);
    if (logAuditoria) {
      await logAuditoria(
        existing ? 'actualizar_seguimiento' : 'registrar_seguimiento',
        `${existing ? 'Actualizó' : 'Registró'} avance ${MESES[mes-1]} ${year} para ${activity.codigoAOI} (Físico: ${entry.avanceFisico}, Financiero: S/${entry.avanceFinanciero.toFixed(2)})`,
        { actividadId: actId, anio: year, mes }
      );
    }
    alert('Avance registrado correctamente');
  }

  async function handleEnviarSolicitud(datos) {
    const nuevaSol = {
      id: uid(),
      tipo: datos.tipo,
      anio: year,
      mes: mes,
      centroCosto: ccSel,
      area: areaSel,
      actividadId: actId,
      codigoAOI: activity?.codigoAOI || '',
      solicitante: datos.solicitante,
      cargo: datos.cargo,
      motivo: datos.motivo,
      diasSolicitados: datos.diasSolicitados,
      fechaSolicitud: new Date().toISOString(),
      estado: 'pendiente',
      fechaRespuesta: null,
      respuestaAdmin: '',
    };
    const next = [...solicitudes, nuevaSol];
    await saveSolicitudes(next);

    if (logAuditoria) {
      await logAuditoria('enviar_solicitud',
        `Solicitó ${datos.tipo === 'reapertura' ? 'reapertura' : datos.tipo === 'ampliacion' ? 'ampliación de plazo' : 'apertura anticipada'} para ${MESES[mes-1]} ${year}`,
        { solicitudId: nuevaSol.id, centroCosto: ccSel });
    }
    if (notificar) {
      const dest = adminUsernames(usuarios);
      await notificar({
        destinatarios: dest,
        tipo: 'solicitud_recibida',
        titulo: `Nueva solicitud — ${ccSel}`,
        mensaje: `${datos.solicitante} solicita ${datos.tipo === 'reapertura' ? 'reapertura' : datos.tipo === 'ampliacion' ? 'ampliación de plazo' : 'apertura anticipada'} para ${MESES[mes-1]} ${year}.`,
        link: 'solicitudes',
      });
    }

    setShowSolicitudModal(false);
    alert('Solicitud enviada. El administrador la revisará y notificará la respuesta.');
  }

  const planFis = activity?.programacion?.[mes - 1]?.fisica || 0;
  const planFin = activity?.programacion?.[mes - 1]?.financiera || 0;

  return (
    <>
      <PageHeader title="Seguimiento mensual" subtitle="Logros, limitaciones y medidas adoptadas"
        action={
          <button onClick={exportarSeguimientoExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: '#1F7A4D', color: '#FFFFFF' }}>
            <FileSpreadsheet size={16} /> Exportar a Excel
          </button>
        } />

      {/* Paso 1: Centro de costo */}
      <Card className="p-5 mb-4">
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
          Paso 1 — Centro de costo
        </div>
        <div className="flex gap-2 flex-wrap">
          {CENTROS_COSTO.filter(c => ccDisponibles.includes(c.nombre)).map(cc => {
            const count = activities.filter(a => a.centroCosto === cc.nombre).length;
            return (
              <button key={cc.codigo} onClick={() => { setCcSel(cc.nombre); setAreaSel(''); }}
                className="px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: ccSel === cc.nombre ? '#1E2A3A' : '#F0E9D9',
                  color: ccSel === cc.nombre ? '#F5F1E8' : '#1E2A3A',
                }}>
                {cc.nombre} <span className="opacity-70 text-xs">({count})</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Paso 2: Área */}
      <Card className="p-5 mb-4">
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
          Paso 2 — Área
        </div>
        <div className="flex gap-2 flex-wrap">
          {areas.length === 0 && <div className="text-sm" style={{ color: '#7A6F5C' }}>No hay áreas en este centro de costo.</div>}
          {areas.map(area => {
            const count = activities.filter(a => a.centroCosto === ccSel && a.area === area).length;
            return (
              <button key={area} onClick={() => setAreaSel(area)}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: areaSel === area ? '#C9A350' : '#FAF7F0',
                  color: areaSel === area ? '#1E2A3A' : '#1E2A3A',
                  border: '1px solid #E5DDD0',
                }}>
                {area} <span className="opacity-60 text-xs">({count})</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Paso 3: Actividad operativa */}
      <Card className="p-5 mb-4">
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
          Paso 3 — Actividad operativa
        </div>
        <div className="space-y-2">
          {actsFiltered.map(a => {
            const isSelected = actId === a.id;
            return (
              <button key={a.id} onClick={() => setActId(a.id)}
                className="w-full text-left px-4 py-3 rounded-md border transition-colors"
                style={{
                  background: isSelected ? '#1E2A3A' : '#FFFFFF',
                  borderColor: isSelected ? '#1E2A3A' : '#E5DDD0',
                  color: isSelected ? '#F5F1E8' : '#1E2A3A',
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-mono mb-1" style={{ color: isSelected ? '#C9A350' : '#9C7A2B' }}>{a.codigoAOI}</div>
                    <div className="text-sm font-medium">{a.nombre}</div>
                  </div>
                  <div className="text-xs whitespace-nowrap" style={{ color: isSelected ? '#D5C9B0' : '#7A6F5C' }}>
                    {a.unidadMedida}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Paso 4: Periodo */}
      <Card className="p-5 mb-4">
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
          Paso 4 — Periodo
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Año">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls}>
              {ANIOS_DISPONIBLES.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Mes">
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className={inputCls}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </Field>
        </div>

        {activity && (
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: '#E5DDD0' }}>
            <div className="px-4 py-3 rounded-md" style={{ background: '#F0E9D9' }}>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Programado físico — {MESES[mes-1]}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
                {planFis} {activity.unidadMedida}
              </div>
            </div>
            <div className="px-4 py-3 rounded-md" style={{ background: '#F0E9D9' }}>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Programado financiero</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
                {fmtMoney(planFin)}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Paso 5: Avance */}
      <Card className="p-5 mb-4">
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
          Paso 5 — Avance ejecutado
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Avance físico (${activity?.unidadMedida || ''})`}>
            <input type="number" value={form.avanceFisico} onChange={(e) => setForm({ ...form, avanceFisico: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Avance financiero (S/)">
            <input type="number" step="0.01" value={form.avanceFinanciero} onChange={(e) => setForm({ ...form, avanceFinanciero: e.target.value })} className={inputCls} />
          </Field>
        </div>
      </Card>

      {/* Paso 6: Comentarios */}
      <Card className="p-5 mb-6">
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
          Paso 6 — Comentarios del periodo
        </div>
        <div className="space-y-4">
          <Field label="Principales logros" full>
            <textarea rows={3} value={form.logros} onChange={(e) => setForm({ ...form, logros: e.target.value })} className={inputCls} placeholder="Describe los principales logros del mes..." />
          </Field>
          <Field label="Limitaciones encontradas" full>
            <textarea rows={3} value={form.limitaciones} onChange={(e) => setForm({ ...form, limitaciones: e.target.value })} className={inputCls} placeholder="Identifica limitaciones, dificultades, riesgos..." />
          </Field>
          <Field label="Medidas adoptadas para cumplir las metas" full>
            <textarea rows={3} value={form.medidas} onChange={(e) => setForm({ ...form, medidas: e.target.value })} className={inputCls} placeholder="Acciones correctivas, gestiones, coordinaciones..." />
          </Field>
        </div>
      </Card>

      {/* Banner de estado del periodo */}
      <PeriodoBanner info={periodoInfo} year={year} mes={mes}
        onSolicitar={() => setShowSolicitudModal(true)} />

      <div className="flex justify-end mb-12">
        <button onClick={handleSave}
          disabled={bloqueado}
          className="flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-opacity"
          style={{
            background: bloqueado ? '#9C9080' : '#1E2A3A',
            color: '#F5F1E8',
            cursor: bloqueado ? 'not-allowed' : 'pointer',
            opacity: bloqueado ? 0.6 : 1,
          }}>
          {bloqueado ? <Lock size={16} /> : <Save size={16} />}
          {bloqueado ? 'Periodo cerrado' : (existing ? 'Actualizar registro' : 'Guardar registro')}
        </button>
      </div>

      {showSolicitudModal && (
        <SolicitudModal
          year={year}
          mes={mes}
          ccSel={ccSel}
          areaSel={areaSel}
          activity={activity}
          periodoInfo={periodoInfo}
          currentUser={currentUser}
          onSubmit={handleEnviarSolicitud}
          onClose={() => setShowSolicitudModal(false)}
        />
      )}
    </>
  );
}

function PeriodoBanner({ info, year, mes, onSolicitar }) {
  if (info.estado === 'abierto' || info.estado === 'sin_config') {
    return (
      <Card className="p-4 mb-4" >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#D8EBD3' }}>
            <Unlock size={16} style={{ color: '#2D7A4E' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: '#2D7A4E' }}>
              Periodo abierto — {MESES[mes-1]} {year}
            </div>
            <div className="text-xs" style={{ color: '#7A6F5C' }}>{info.motivo}</div>
          </div>
        </div>
      </Card>
    );
  }
  const titulo = info.estado === 'cerrado' ? 'Periodo cerrado' : 'Periodo aún no aperturado';
  const bg = info.estado === 'cerrado' ? '#F5D5D5' : '#FBF1D9';
  const color = info.estado === 'cerrado' ? '#B33B3B' : '#9C7A2B';
  return (
    <Card className="p-4 mb-4" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: bg }}>
          <Lock size={16} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color }}>
            {titulo} — {MESES[mes-1]} {year}
          </div>
          <div className="text-xs" style={{ color: '#7A6F5C' }}>{info.motivo}. Los registros no pueden modificarse.</div>
        </div>
        <button onClick={onSolicitar}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors"
          style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
          <Send size={14} /> Solicitar apertura
        </button>
      </div>
    </Card>
  );
}

function SolicitudModal({ year, mes, ccSel, areaSel, activity, periodoInfo, currentUser, onSubmit, onClose }) {
  const [tipo, setTipo] = useState(periodoInfo.estado === 'cerrado' ? 'reapertura' : 'apertura_anticipada');
  const [solicitante, setSolicitante] = useState(currentUser?.nombre || '');
  const [cargo, setCargo] = useState(currentUser?.centroCosto ? `Responsable ${currentUser.centroCosto}` : '');
  const [motivo, setMotivo] = useState('');
  const [diasSolicitados, setDiasSolicitados] = useState(5);

  function send() {
    if (!solicitante || !motivo) {
      alert('El nombre del solicitante y el motivo son obligatorios');
      return;
    }
    onSubmit({ tipo, solicitante, cargo, motivo, diasSolicitados });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5DDD0' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
              Solicitud al administrador
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
              {ccSel} · {areaSel || '—'} · {activity?.codigoAOI || '—'} · {MESES[mes-1]} {year}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Tipo de solicitud">
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
              <option value="reapertura">Reapertura del periodo (registro inicial o modificación)</option>
              <option value="ampliacion">Ampliación de plazo de registro</option>
              <option value="apertura_anticipada">Apertura anticipada</option>
            </select>
          </Field>
          {(tipo === 'ampliacion' || tipo === 'reapertura') && (
            <Field label="Días adicionales solicitados">
              <input type="number" min="1" max="60" value={diasSolicitados}
                onChange={(e) => setDiasSolicitados(Number(e.target.value) || 1)} className={inputCls} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre del solicitante">
              <input type="text" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} className={inputCls} placeholder="Ej. Juan Pérez" />
            </Field>
            <Field label="Cargo / Área">
              <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputCls} placeholder="Ej. Coordinador UGERDES" />
            </Field>
          </div>
          <Field label="Motivo / justificación" full>
            <textarea rows={5} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputCls}
              placeholder="Explica las razones por las que se requiere la apertura o ampliación del plazo..." />
          </Field>
          <div className="p-3 rounded-md text-xs" style={{ background: '#F0E9D9', color: '#7A6F5C' }}>
            Esta solicitud será enviada al administrador del sistema. Recibirás respuesta en el módulo de seguimiento una vez sea revisada.
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: '#E5DDD0' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cancelar</button>
          <button onClick={send}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
            style={{ background: '#C9A350', color: '#1E2A3A' }}>
            <Send size={14} /> Enviar solicitud
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODIFICACIONES PRESUPUESTALES
============================================================ */
function Modificaciones({ activities, modifs, saveModifs, currentUser }) {
  const ccDisponibles = ccsVisibles(currentUser);
  // Solo el administrador puede registrar, editar o eliminar modificaciones presupuestales.
  // Los responsables de centro de costo y los lectores tienen solo lectura.
  const canEdit = esAdmin(currentUser);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtroCC, setFiltroCC] = useState(esResponsableCC(currentUser) ? currentUser.centroCosto : 'TODOS');
  const [filtroMes, setFiltroMes] = useState('TODOS');

  const areasUser = expandirAreasUsuario(currentUser);
  const visibleModifs = esResponsableCC(currentUser)
    ? modifs.filter(m => {
        if (m.centroCosto !== currentUser.centroCosto) return false;
        if (!areasUser) return true;
        // Filtrar por área si la modificación está asociada a un AOI
        if (m.codigoAOI) {
          const act = activities.find(a => a.codigoAOI === m.codigoAOI);
          if (act) return areasUser.includes(act.area);
        }
        return true;
      })
    : modifs;

  // Aplicar filtros del usuario
  const filteredModifs = useMemo(() => {
    let r = visibleModifs;
    if (filtroCC !== 'TODOS') r = r.filter(m => m.centroCosto === filtroCC);
    if (filtroMes !== 'TODOS') r = r.filter(m => Number(m.mes) === Number(filtroMes));
    return r.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }, [visibleModifs, filtroCC, filtroMes]);

  // Reset mes si cambia CC y no hay datos
  useEffect(() => {
    setFiltroMes('TODOS');
  }, [filtroCC]);

  const TIPOS = [
    'Tipo I - Créditos Suplementarios',
    'Tipo II - Reducción Presupuestal',
    'Tipo III - Créditos y Anulaciones',
    'Tipo IV - Habilitaciones entre UE',
    'Tipo V - Modif. funcional programático',
  ];

  function newModif() {
    setEditing({
      id: uid(),
      fecha: new Date().toISOString().slice(0, 10),
      anio: 2026,
      mes: new Date().getMonth() + 1,
      centroCosto: esResponsableCC(currentUser) ? currentUser.centroCosto : (filtroCC !== 'TODOS' ? filtroCC : CENTROS_COSTO[0].nombre),
      area: 'TODAS',
      codigoAOI: '',
      tipo: TIPOS[2],
      // Nuevo: clasificadores como arreglo con importe individual
      clasificadores: [{ id: uid(), clasificador: '', importe: 0 }],
      // Mantener compatibilidad con datos antiguos: clasificador único e importe agregado
      clasificador: '',
      importe: 0,
      concepto: '',
    });
    setShowForm(true);
  }

  function editModif(m) {
    const copia = JSON.parse(JSON.stringify(m));
    // Migración de datos antiguos: si no hay clasificadores[], crear uno desde clasificador+importe
    if (!Array.isArray(copia.clasificadores) || copia.clasificadores.length === 0) {
      copia.clasificadores = [{
        id: uid(),
        clasificador: copia.clasificador || '',
        importe: Number(copia.importe) || 0,
      }];
    }
    setEditing(copia);
    setShowForm(true);
  }

  async function handleSave() {
    if (!editing.centroCosto) {
      alert('Centro de costo es obligatorio');
      return;
    }
    // Validar clasificadores
    const clasifs = (editing.clasificadores || []).filter(c => c.clasificador && c.clasificador.trim() && Number(c.importe) > 0);
    if (clasifs.length === 0) {
      alert('Debes registrar al menos un clasificador con importe mayor a 0');
      return;
    }
    // Calcular importe total a partir de los clasificadores
    const totalImporte = clasifs.reduce((s, c) => s + (Number(c.importe) || 0), 0);
    const clasifText = clasifs.map(c => `${c.clasificador} (S/ ${Number(c.importe).toFixed(2)})`).join(' | ');

    const final = {
      ...editing,
      clasificadores: clasifs,
      importe: totalImporte,
      clasificador: clasifText, // Para compatibilidad/visualización
    };
    // Eliminar el campo documento si quedó
    delete final.documento;

    const exists = modifs.find(x => x.id === final.id);
    const next = exists ? modifs.map(x => x.id === final.id ? final : x) : [...modifs, final];
    await saveModifs(next);
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta modificación?')) return;
    await saveModifs(modifs.filter(x => x.id !== id));
  }

  const porCC = CENTROS_COSTO.filter(c => ccDisponibles.includes(c.nombre)).map(cc => {
    const items = modifs.filter(m => m.centroCosto === cc.nombre);
    const total = items.reduce((s, m) => s + (Number(m.importe) || 0), 0);
    return { ...cc, count: items.length, total, pim: cc.pia + total };
  });

  return (
    <>
      <PageHeader title="Modificaciones presupuestales" subtitle="Por centro de costo"
        action={canEdit && (
          <button onClick={newModif}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
            <Plus size={16} /> Nueva modificación
          </button>
        )} />

      {!canEdit && (
        <Card className="p-3 mb-4" style={{ borderLeft: '4px solid #C9A350' }}>
          <div className="flex items-center gap-2">
            <Eye size={16} style={{ color: '#9C7A2B' }} />
            <div className="text-xs" style={{ color: '#7A6F5C' }}>
              <strong style={{ color: '#1E2A3A' }}>Modo solo lectura.</strong> El registro y edición de modificaciones presupuestales está reservado al administrador (Planeamiento y Presupuesto).
            </div>
          </div>
        </Card>
      )}

      <div className={`grid gap-4 mb-6 ${porCC.length === 1 ? 'grid-cols-1' : 'grid-cols-4'}`}>
        {porCC.map(cc => (
          <Card key={cc.codigo} className="p-4">
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>{cc.nombre}</div>
            <div className="text-xs mb-2" style={{ color: '#9C7A2B' }}>{cc.count} modificaciones</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, color: '#1E2A3A' }}>
              {fmtMoneyShort(cc.total)}
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>PIM: {fmtMoneyShort(cc.pim)}</div>
          </Card>
        ))}
      </div>

      {/* Filtros: CC + Mes */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} style={{ color: '#7A6F5C' }} />
          <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#7A6F5C' }}>Centro de costo:</span>
          {!esResponsableCC(currentUser) && (
            <button onClick={() => setFiltroCC('TODOS')}
              className="text-xs px-3 py-1 rounded-md font-medium"
              style={{
                background: filtroCC === 'TODOS' ? '#1E2A3A' : '#F0E9D9',
                color: filtroCC === 'TODOS' ? '#F5F1E8' : '#1E2A3A',
              }}>Todos ({visibleModifs.length})</button>
          )}
          {CENTROS_COSTO.filter(c => ccDisponibles.includes(c.nombre)).map(cc => {
            const count = visibleModifs.filter(m => m.centroCosto === cc.nombre).length;
            return (
              <button key={cc.codigo} onClick={() => setFiltroCC(cc.nombre)}
                className="text-xs px-3 py-1 rounded-md font-medium"
                style={{
                  background: filtroCC === cc.nombre ? '#1E2A3A' : '#F0E9D9',
                  color: filtroCC === cc.nombre ? '#F5F1E8' : '#1E2A3A',
                }}>
                {cc.nombre} ({count})
              </button>
            );
          })}
        </div>

        {/* Selector de mes: solo aparece cuando hay un CC específico */}
        {filtroCC !== 'TODOS' && (
          <div className="flex items-center gap-3 flex-wrap mt-3 pt-3" style={{ borderTop: '1px dashed #E5DDD0' }}>
            <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#7A6F5C' }}>Mes:</span>
            <button onClick={() => setFiltroMes('TODOS')}
              className="text-xs px-3 py-1 rounded-md font-medium"
              style={{
                background: filtroMes === 'TODOS' ? '#C9A350' : '#F0E9D9',
                color: '#1E2A3A',
              }}>
              Todos ({visibleModifs.filter(m => m.centroCosto === filtroCC).length})
            </button>
            {MESES.map((nom, i) => {
              const mesNum = i + 1;
              const count = visibleModifs.filter(m => m.centroCosto === filtroCC && Number(m.mes) === mesNum).length;
              if (count === 0) return null;
              return (
                <button key={mesNum} onClick={() => setFiltroMes(mesNum)}
                  className="text-xs px-3 py-1 rounded-md font-medium"
                  style={{
                    background: filtroMes === mesNum ? '#C9A350' : '#F0E9D9',
                    color: '#1E2A3A',
                  }}>
                  {nom} ({count})
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Fecha</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>CC</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>AOI</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Tipo</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Clasificadores</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Importe</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredModifs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: '#7A6F5C' }}>
                  Sin modificaciones registradas{filtroCC !== 'TODOS' ? ` en ${filtroCC}${filtroMes !== 'TODOS' ? ' para ' + MESES[filtroMes - 1] : ''}` : ''}.
                </td></tr>
              )}
              {filteredModifs.map((m) => {
                const clasifs = Array.isArray(m.clasificadores) && m.clasificadores.length > 0
                  ? m.clasificadores
                  : (m.clasificador ? [{ clasificador: m.clasificador, importe: m.importe }] : []);
                return (
                <tr key={m.id} className="border-b last:border-b-0 hover:bg-stone-50" style={{ borderColor: '#E5DDD0' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>{m.fecha}</td>
                  <td className="px-4 py-3"><Pill>{m.centroCosto}</Pill></td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#1E2A3A' }}>{m.codigoAOI}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>{m.tipo}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#7A6F5C', maxWidth: 280 }}>
                    {clasifs.length === 1 ? (
                      <div className="truncate" title={clasifs[0].clasificador}>{clasifs[0].clasificador}</div>
                    ) : (
                      <div>
                        <div className="font-semibold mb-1" style={{ color: '#9C7A2B' }}>{clasifs.length} clasificadores:</div>
                        {clasifs.map((c, idx) => (
                          <div key={idx} className="truncate text-[11px]" title={c.clasificador}>
                            • {c.clasificador}: <strong>{fmtMoneyShort(c.importe)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: '#1E2A3A' }}>{fmtMoney(m.importe)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {canEdit && puedeEditarCC(currentUser, m.centroCosto) ? (
                      <>
                        <button onClick={() => editModif(m)} className="p-1.5 rounded hover:bg-stone-200 mr-1" title="Editar">
                          <Edit3 size={14} style={{ color: '#1E2A3A' }} />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-red-50" title="Eliminar">
                          <Trash2 size={14} style={{ color: '#B33B3B' }} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: '#9C9080' }}>—</span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && editing && (
        <ModifForm modif={editing} setModif={setEditing} activities={activities} tipos={TIPOS}
          onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </>
  );
}

function ModifForm({ modif, setModif, activities, tipos, onSave, onClose }) {
  function update(f, v) { setModif({ ...modif, [f]: v }); }

  // Áreas disponibles en el CC seleccionado (basadas en las actividades)
  const areasDisponibles = useMemo(() => {
    const predefinidas = (typeof AREAS_POR_CC !== 'undefined' && AREAS_POR_CC[modif.centroCosto]) || [];
    const enUso = Array.from(new Set(
      activities.filter(a => a.centroCosto === modif.centroCosto && a.area).map(a => a.area)
    ));
    return Array.from(new Set([...predefinidas, ...enUso])).sort();
  }, [modif.centroCosto, activities]);

  // AOIs filtrados por CC y Área (si hay área seleccionada)
  const ccActs = useMemo(() => {
    let r = activities.filter(a => a.centroCosto === modif.centroCosto);
    if (modif.area && modif.area !== 'TODAS') {
      r = r.filter(a => a.area === modif.area);
    }
    return r;
  }, [activities, modif.centroCosto, modif.area]);

  // Si cambia el CC, resetear área a TODAS y limpiar AOI
  function cambiarCC(nuevoCC) {
    setModif({ ...modif, centroCosto: nuevoCC, area: 'TODAS', codigoAOI: '' });
  }

  // Si cambia el área, limpiar AOI si ya no aplica
  function cambiarArea(nuevaArea) {
    const aoisFiltrados = activities.filter(a => a.centroCosto === modif.centroCosto && (nuevaArea === 'TODAS' || a.area === nuevaArea));
    const aoiSigueValido = aoisFiltrados.some(a => a.codigoAOI === modif.codigoAOI);
    setModif({ ...modif, area: nuevaArea, codigoAOI: aoiSigueValido ? modif.codigoAOI : '' });
  }

  // Asegurar que siempre exista el array de clasificadores
  const clasificadores = Array.isArray(modif.clasificadores) && modif.clasificadores.length > 0
    ? modif.clasificadores
    : [{ id: uid(), clasificador: '', importe: 0 }];

  function actualizarClasif(idx, field, value) {
    const next = [...clasificadores];
    next[idx] = { ...next[idx], [field]: field === 'importe' ? (Number(value) || 0) : value };
    setModif({ ...modif, clasificadores: next });
  }

  function agregarClasif() {
    const next = [...clasificadores, { id: uid(), clasificador: '', importe: 0 }];
    setModif({ ...modif, clasificadores: next });
  }

  function eliminarClasif(idx) {
    if (clasificadores.length === 1) {
      alert('Debe haber al menos un clasificador. Si no aplica, deja el campo vacío.');
      return;
    }
    const next = clasificadores.filter((_, i) => i !== idx);
    setModif({ ...modif, clasificadores: next });
  }

  const totalImporte = clasificadores.reduce((s, c) => s + (Number(c.importe) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ background: '#FAF7F0', borderColor: '#E5DDD0' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
            Modificación presupuestal
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <Field label="Fecha">
            <input type="date" value={modif.fecha} onChange={(e) => update('fecha', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Centro de Costo">
            <select value={modif.centroCosto} onChange={(e) => cambiarCC(e.target.value)} className={inputCls}>
              {CENTROS_COSTO.map(cc => <option key={cc.codigo} value={cc.nombre}>{cc.nombre}</option>)}
            </select>
          </Field>
          <Field label="Área / Unidad">
            <select value={modif.area || 'TODAS'} onChange={(e) => cambiarArea(e.target.value)} className={inputCls}>
              <option value="TODAS">— Todas las áreas —</option>
              {areasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Mes">
            <select value={modif.mes} onChange={(e) => update('mes', Number(e.target.value))} className={inputCls}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </Field>
          <Field label="AOI afectado">
            <select value={modif.codigoAOI} onChange={(e) => update('codigoAOI', e.target.value)} className={inputCls}>
              <option value="">Seleccionar...</option>
              {ccActs.map(a => <option key={a.id} value={a.codigoAOI}>{a.codigoAOI}</option>)}
            </select>
          </Field>
          <Field label="Tipo de modificación" full>
            <select value={modif.tipo} onChange={(e) => update('tipo', e.target.value)} className={inputCls}>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        {/* Bloque de clasificadores múltiples */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7A6F5C' }}>
              Clasificadores de gasto
            </label>
            <button type="button" onClick={agregarClasif}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold"
              style={{ background: '#C9A350', color: '#1E2A3A' }}>
              <Plus size={12} /> Agregar clasificador
            </button>
          </div>

          <div className="space-y-2">
            {clasificadores.map((c, idx) => (
              <div key={c.id || idx} className="flex gap-2 items-start p-2 rounded" style={{ background: '#FAF7F0', border: '1px solid #E5DDD0' }}>
                <div className="flex-1">
                  <input type="text"
                    value={c.clasificador}
                    onChange={(e) => actualizarClasif(idx, 'clasificador', e.target.value)}
                    placeholder="2.3.1.3.1.1 COMBUSTIBLES Y CARBURANTES"
                    className={inputCls} />
                </div>
                <div style={{ width: 160 }}>
                  <input type="number" step="0.01"
                    value={c.importe}
                    onChange={(e) => actualizarClasif(idx, 'importe', e.target.value)}
                    placeholder="Importe S/"
                    className={inputCls} />
                </div>
                <button type="button" onClick={() => eliminarClasif(idx)}
                  className="p-2 rounded hover:bg-red-50"
                  title="Eliminar clasificador"
                  style={{ color: '#B33B3B' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end mt-3 p-2 rounded" style={{ background: '#1E2A3A' }}>
            <span className="text-xs uppercase tracking-wider mr-3" style={{ color: '#C9A350' }}>Importe total:</span>
            <strong style={{ color: '#F5F1E8', fontSize: 16 }}>{fmtMoney(totalImporte)}</strong>
          </div>
        </div>

        <div className="px-6 pt-2 pb-6">
          <Field label="Concepto / sustento" full>
            <textarea rows={3} value={modif.concepto} onChange={(e) => update('concepto', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: '#E5DDD0' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cancelar</button>
          <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold" style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
            <Save size={14} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   REPORTE — Pantalla principal con dos pestañas
   Tab 1: Reporte Ejecutivo (resumen mensual por CC)
   Tab 2: Informe Técnico (modelo oficial PNC con introducción, base legal, etc.)
============================================================ */
function Reporte({ activities, progress, modifs, currentUser }) {
  const [tab, setTab] = useState('ejecutivo'); // 'ejecutivo' | 'tecnico'

  return (
    <>
      <PageHeader title="Reportes e Informes POI" subtitle="Genera reportes ejecutivos e informes técnicos institucionales" />

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b" style={{ borderColor: '#E5DDD0' }}>
        <button onClick={() => setTab('ejecutivo')}
          className="px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{
            color: tab === 'ejecutivo' ? '#1E2A3A' : '#7A6F5C',
            borderBottom: tab === 'ejecutivo' ? '3px solid #C9A350' : '3px solid transparent',
            marginBottom: -1,
          }}>
          📋 Reporte Ejecutivo Mensual
        </button>
        <button onClick={() => setTab('tecnico')}
          className="px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-2"
          style={{
            color: tab === 'tecnico' ? '#1E2A3A' : '#7A6F5C',
            borderBottom: tab === 'tecnico' ? '3px solid #C9A350' : '3px solid transparent',
            marginBottom: -1,
          }}>
          📄 Informe Técnico Oficial
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #C9A350 0%, #E5C66D 100%)',
              color: '#1E2A3A',
              boxShadow: '0 1px 3px rgba(201,163,80,0.4)',
            }}>
            ✨ IA
          </span>
        </button>
      </div>

      {tab === 'ejecutivo' && (
        <ReporteEjecutivo activities={activities} progress={progress} modifs={modifs} currentUser={currentUser} />
      )}
      {tab === 'tecnico' && (
        <InformeTecnico activities={activities} progress={progress} modifs={modifs} currentUser={currentUser} />
      )}
    </>
  );
}

/* ============================================================
   REPORTE EJECUTIVO MENSUAL — Estructura original institucional
   Por centro de costo: I Resumen, II Logros, III Limitaciones, IV Medidas, V Modificaciones
   Exportable a Word
============================================================ */
function ReporteEjecutivo({ activities, progress, modifs, currentUser }) {
  const ccDisponibles = ccsVisibles(currentUser);
  const ccsParaReporte = CENTROS_COSTO.filter(c => ccDisponibles.includes(c.nombre));
  // 'TODOS' = todos los CC visibles en un solo reporte consolidado
  const [ccSel, setCcSel] = useState(ccsParaReporte.length > 1 ? 'TODOS' : (ccsParaReporte[0]?.nombre || CENTROS_COSTO[0].nombre));
  const [year, setYear] = useState(2026);
  const [mesFin, setMesFin] = useState(3);

  const esTodos = ccSel === 'TODOS';
  const mesesIncluir = Array.from({ length: mesFin }, (_, i) => i + 1);

  // CCs a incluir en este reporte
  const ccsIncluidos = esTodos ? ccsParaReporte : ccsParaReporte.filter(c => c.nombre === ccSel);

  // Para cada CC incluido, recopilar datos
  const datosPorCC = ccsIncluidos.map(cc => {
    const actsCC = activities.filter(a => a.centroCosto === cc.nombre);
    const reporteData = actsCC.map(a => {
      const registros = progress.filter(p => p.actividadId === a.id && p.anio === year && mesesIncluir.includes(p.mes))
        .sort((x, y) => x.mes - y.mes);
      return { actividad: a, registros };
    });
    const modsCC = modifs.filter(m => m.centroCosto === cc.nombre && m.anio === year && mesesIncluir.includes(m.mes))
      .sort((a, b) => a.mes - b.mes);
    const totalMods = modifs.filter(m => m.centroCosto === cc.nombre && m.anio === year)
      .reduce((s, m) => s + (Number(m.importe) || 0), 0);
    const pim = cc.pia + totalMods;
    const variacion = cc.pia > 0 ? ((pim - cc.pia) / cc.pia) * 100 : 0;
    return { cc, actsCC, reporteData, modsCC, totalMods, pim, variacion };
  });

  // Para vista de un solo CC (compatibilidad con bloques que esperaban variables sueltas)
  const cc = ccsIncluidos[0]?.cc || CENTROS_COSTO[0];
  const primerDato = datosPorCC[0] || { cc, actsCC: [], reporteData: [], modsCC: [], totalMods: 0, pim: cc.pia, variacion: 0 };
  const acts = primerDato.actsCC;
  const reporteData = primerDato.reporteData;
  const modsCC = primerDato.modsCC;
  const totalMods = primerDato.totalMods;
  const pim = primerDato.pim;
  const variacion = primerDato.variacion;

  async function exportarWord() {
    const html = construirHTML();
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nombreArchivo = esTodos ? 'TODOS_CC' : ccSel.replace(/\s+/g, '_');
    link.download = `Reporte_Ejecutivo_${nombreArchivo}_${year}_al_${MESES[mesFin - 1]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function construirHTML() {
    const styles = `
      <style>
        @page { size: A4; margin: 2.5cm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1E2A3A; }
        h1 { font-size: 18pt; text-align: center; color: #1E2A3A; margin-bottom: 4px; }
        h2 { font-size: 13pt; color: #1E2A3A; border-bottom: 2px solid #C9A350; padding-bottom: 4px; margin-top: 20px; }
        h3 { font-size: 11pt; color: #9C7A2B; margin-top: 14px; margin-bottom: 6px; }
        .center { text-align: center; }
        .info-box { background: #FAF7F0; border-left: 4px solid #C9A350; padding: 10px; margin: 10px 0; font-size: 10pt; }
        table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 10pt; }
        th { background: #1E2A3A; color: #fff; padding: 6px; text-align: left; }
        td { border: 1px solid #ccc; padding: 5px; }
        p { text-align: justify; }
        .mes-label { color: #9C7A2B; font-weight: bold; }
        .sin-reg { color: #9C9080; font-style: italic; }
      </style>`;

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body>`;
    html += `<h1>Resumen Ejecutivo de Seguimiento mensual del POI</h1>`;
    html += `<p class="center">PROGRAMA NUESTRAS CIUDADES — ${year}</p>`;
    html += `<p class="center">Periodo: Enero — ${MESES[mesFin - 1]} ${year}</p>`;

    if (esTodos) {
      // ========== Reporte CONSOLIDADO de todos los CC ==========
      html += `<p class="center"><strong>REPORTE CONSOLIDADO — ${datosPorCC.length} Centros de Costo</strong></p>`;

      // Resumen general agregado
      const totPIA = datosPorCC.reduce((s, d) => s + d.cc.pia, 0);
      const totPIM = datosPorCC.reduce((s, d) => s + d.pim, 0);
      const totMods = datosPorCC.reduce((s, d) => s + d.totalMods, 0);
      const totActs = datosPorCC.reduce((s, d) => s + d.actsCC.length, 0);
      const variacionTot = totPIA > 0 ? ((totPIM - totPIA) / totPIA) * 100 : 0;

      html += `<h2>I. RESUMEN EJECUTIVO CONSOLIDADO</h2>`;
      html += `<p>El presente reporte consolida la información de seguimiento del Plan Operativo Institucional (${year}) correspondiente a ${datosPorCC.length} Centros de Costo del Programa Nuestras Ciudades, abarcando el periodo de enero a ${MESES[mesFin - 1].toLowerCase()} de ${year}.</p>`;
      html += `<div class="info-box">`;
      html += `<strong>PIA total:</strong> ${fmtMoney(totPIA)} &nbsp;|&nbsp; `;
      html += `<strong>PIM total:</strong> ${fmtMoney(totPIM)} &nbsp;|&nbsp; `;
      html += `<strong>Modificaciones:</strong> ${fmtMoney(totMods)} &nbsp;|&nbsp; `;
      html += `<strong>Variación:</strong> ${variacionTot >= 0 ? '+' : ''}${variacionTot.toFixed(2)}% &nbsp;|&nbsp; `;
      html += `<strong>Total actividades:</strong> ${totActs} &nbsp;|&nbsp; `;
      html += `<strong>Centros de Costo:</strong> ${datosPorCC.length}</div>`;

      // Iterar por cada CC
      datosPorCC.forEach((d, idx) => {
        html += `<div style="page-break-before: ${idx > 0 ? 'always' : 'auto'}"></div>`;
        html += `<h1>Centro de Costo ${idx + 1}: ${d.cc.codigo} — ${d.cc.nombre}</h1>`;

        html += `<h2>${idx + 2}.1 RESUMEN</h2>`;
        html += `<p>${d.cc.resumen || ''}</p>`;
        html += `<div class="info-box">`;
        html += `<strong>PIA:</strong> ${fmtMoney(d.cc.pia)} &nbsp;|&nbsp; `;
        html += `<strong>PIM:</strong> ${fmtMoney(d.pim)} &nbsp;|&nbsp; `;
        html += `<strong>Variación:</strong> ${d.variacion >= 0 ? '+' : ''}${d.variacion.toFixed(2)}% &nbsp;|&nbsp; `;
        html += `<strong>Actividades:</strong> ${d.actsCC.length}</div>`;

        html += `<h2>${idx + 2}.2 Principales logros</h2>`;
        d.reporteData.forEach(({ actividad, registros }) => {
          html += `<h3>${actividad.codigoAOI}: ${actividad.nombre}</h3>`;
          mesesIncluir.forEach(m => {
            const r = registros.find(x => x.mes === m);
            html += `<p><span class="mes-label">${MESES[m - 1]}:</span> ${r?.logros || '<span class="sin-reg">Sin registro para el periodo.</span>'}</p>`;
          });
        });

        html += `<h2>${idx + 2}.3 Limitaciones</h2>`;
        d.reporteData.forEach(({ actividad, registros }) => {
          html += `<h3>${actividad.codigoAOI}: ${actividad.nombre}</h3>`;
          mesesIncluir.forEach(m => {
            const r = registros.find(x => x.mes === m);
            html += `<p><span class="mes-label">${MESES[m - 1]}:</span> ${r?.limitaciones || '<span class="sin-reg">Sin registro para el periodo.</span>'}</p>`;
          });
        });

        html += `<h2>${idx + 2}.4 Medidas adoptadas</h2>`;
        d.reporteData.forEach(({ actividad, registros }) => {
          html += `<h3>${actividad.codigoAOI}: ${actividad.nombre}</h3>`;
          mesesIncluir.forEach(m => {
            const r = registros.find(x => x.mes === m);
            html += `<p><span class="mes-label">${MESES[m - 1]}:</span> ${r?.medidas || '<span class="sin-reg">Sin registro para el periodo.</span>'}</p>`;
          });
        });

        html += `<h2>${idx + 2}.5 Modificaciones presupuestales</h2>`;
        mesesIncluir.forEach(m => {
          const monthMods = d.modsCC.filter(x => x.mes === m);
          if (monthMods.length === 0) return;
          html += `<h3>${MESES[m - 1]}</h3>`;
          const byTipo = {};
          monthMods.forEach(mm => {
            const tipo = mm.tipo || 'Sin tipo';
            if (!byTipo[tipo]) byTipo[tipo] = [];
            byTipo[tipo].push(mm);
          });
          Object.entries(byTipo).forEach(([tipo, lista]) => {
            html += `<p><strong>${tipo}:</strong></p>`;
            html += `<table><tr><th>AOI</th><th>Importe</th><th>Concepto</th></tr>`;
            let sumTipo = 0;
            lista.forEach(mm => {
              const imp = Number(mm.importe) || 0;
              sumTipo += imp;
              html += `<tr><td>${mm.codigoAOI || '-'}</td><td style="text-align:right">${fmtMoney(imp)}</td><td>${mm.concepto || '-'}</td></tr>`;
            });
            html += `<tr><td colspan="1"><strong>Total</strong></td><td style="text-align:right"><strong>${fmtMoney(sumTipo)}</strong></td><td></td></tr>`;
            html += `</table>`;
          });
        });
      });

      html += `</body></html>`;
      return html;
    }

    // ========== Reporte de UN SOLO CC (original) ==========
    html += `<p class="center"><strong>CENTRO DE COSTOS ${cc.codigo} - ${cc.nombre}</strong></p>`;

    // I. Resumen
    html += `<h2>I. RESUMEN EJECUTIVO</h2>`;
    html += `<p>${cc.resumen || ''}</p>`;
    html += `<div class="info-box">`;
    html += `<strong>PIA:</strong> ${fmtMoney(cc.pia)} &nbsp;|&nbsp; `;
    html += `<strong>PIM al cierre:</strong> ${fmtMoney(pim)} &nbsp;|&nbsp; `;
    html += `<strong>Variación:</strong> ${variacion >= 0 ? '+' : ''}${variacion.toFixed(2)}% &nbsp;|&nbsp; `;
    html += `<strong>Actividades:</strong> ${acts.length}</div>`;

    // II. Logros
    html += `<h2>II. PRINCIPALES LOGROS</h2>`;
    reporteData.forEach(({ actividad, registros }) => {
      html += `<h3>${actividad.codigoAOI}: ${actividad.nombre}</h3>`;
      mesesIncluir.forEach(m => {
        const r = registros.find(x => x.mes === m);
        html += `<p><span class="mes-label">${MESES[m - 1]}:</span> ${r?.logros || '<span class="sin-reg">Sin registro para el periodo.</span>'}</p>`;
      });
    });

    // III. Limitaciones
    html += `<h2>III. LIMITACIONES</h2>`;
    reporteData.forEach(({ actividad, registros }) => {
      html += `<h3>${actividad.codigoAOI}: ${actividad.nombre}</h3>`;
      mesesIncluir.forEach(m => {
        const r = registros.find(x => x.mes === m);
        html += `<p><span class="mes-label">${MESES[m - 1]}:</span> ${r?.limitaciones || '<span class="sin-reg">Sin registro para el periodo.</span>'}</p>`;
      });
    });

    // IV. Medidas
    html += `<h2>IV. MEDIDAS ADOPTADAS PARA CUMPLIR LAS METAS</h2>`;
    reporteData.forEach(({ actividad, registros }) => {
      html += `<h3>${actividad.codigoAOI}: ${actividad.nombre}</h3>`;
      mesesIncluir.forEach(m => {
        const r = registros.find(x => x.mes === m);
        html += `<p><span class="mes-label">${MESES[m - 1]}:</span> ${r?.medidas || '<span class="sin-reg">Sin registro para el periodo.</span>'}</p>`;
      });
    });

    // V. Modificaciones
    html += `<h2>V. MODIFICACIONES PRESUPUESTALES</h2>`;
    mesesIncluir.forEach(m => {
      const monthMods = modsCC.filter(x => x.mes === m);
      const modsHastaMes = modifs.filter(x => x.centroCosto === ccSel && x.anio === year && x.mes <= m)
        .reduce((s, x) => s + (Number(x.importe) || 0), 0);
      const pimMes = cc.pia + modsHastaMes;
      const varMes = cc.pia > 0 ? ((pimMes - cc.pia) / cc.pia) * 100 : 0;

      html += `<h3>${MESES[m - 1]}</h3>`;
      html += `<p>El Centro de Costo ${cc.codigo} - ${cc.nombre} al cierre del mes de ${MESES[m - 1].toLowerCase()} ${year}, contó con un PIA de <strong>${fmtMoney(cc.pia)}</strong> y un PIM de <strong>${fmtMoney(pimMes)}</strong>, representando un incremento/disminución de <strong>${varMes.toFixed(2)}%</strong> del PIA.</p>`;

      if (monthMods.length === 0) {
        html += `<p><em>En el mes de ${MESES[m - 1].toLowerCase()} no se aprobaron modificaciones presupuestales.</em></p>`;
      } else {
        const byTipo = {};
        monthMods.forEach(mm => {
          const tipo = mm.tipo || 'Sin tipo';
          if (!byTipo[tipo]) byTipo[tipo] = [];
          byTipo[tipo].push(mm);
        });
        Object.entries(byTipo).forEach(([tipo, lista]) => {
          html += `<p><strong>${tipo}:</strong></p>`;
          html += `<table><tr><th>AOI</th><th>Importe</th><th>Concepto</th></tr>`;
          let sumTipo = 0;
          lista.forEach(mm => {
            const imp = Number(mm.importe) || 0;
            sumTipo += imp;
            html += `<tr><td>${mm.codigoAOI || '-'}</td><td style="text-align:right">${fmtMoney(imp)}</td><td>${mm.concepto || '-'}</td></tr>`;
          });
          html += `<tr><td colspan="1"><strong>Total</strong></td><td style="text-align:right"><strong>${fmtMoney(sumTipo)}</strong></td><td></td></tr>`;
          html += `</table>`;
        });
      }
    });

    html += `</body></html>`;
    return html;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={exportarWord}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
          style={{ background: '#C9A350', color: '#1E2A3A' }}>
          <Download size={16} /> Exportar a Word
        </button>
      </div>

      <Card className="p-5 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Centro de costo">
            <select value={ccSel} onChange={(e) => setCcSel(e.target.value)} className={inputCls}>
              {ccsParaReporte.length > 1 && (
                <option value="TODOS">📋 TODOS los Centros de Costo (consolidado)</option>
              )}
              {ccsParaReporte.map(c => <option key={c.codigo} value={c.nombre}>{c.codigo} — {c.nombre}</option>)}
            </select>
          </Field>
          <Field label="Año">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls}>
              {ANIOS_DISPONIBLES.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Reporte al mes de">
            <select value={mesFin} onChange={(e) => setMesFin(Number(e.target.value))} className={inputCls}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="p-8">
        <div className="text-center mb-8">
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: '#1E2A3A' }}>
            Resumen Ejecutivo de Seguimiento mensual del POI
          </div>
          <div className="text-sm mt-2" style={{ color: '#7A6F5C' }}>PROGRAMA NUESTRAS CIUDADES — {year}</div>
          <div className="text-sm" style={{ color: '#7A6F5C' }}>Periodo: Enero — {MESES[mesFin - 1]} {year}</div>
          {esTodos ? (
            <div className="text-sm mt-2 font-semibold" style={{ color: '#1E2A3A' }}>
              REPORTE CONSOLIDADO DE TODOS LOS CENTROS DE COSTO ({datosPorCC.length})
            </div>
          ) : (
            <div className="text-sm mt-2 font-semibold" style={{ color: '#1E2A3A' }}>
              CENTRO DE COSTOS {cc.codigo} - {cc.nombre}
            </div>
          )}
        </div>

        {esTodos ? (
          // ============ Vista CONSOLIDADA: todos los CC ============
          <>
            {/* Resumen general agregado */}
            <ReportSection num="I" title="RESUMEN EJECUTIVO CONSOLIDADO">
              <p className="text-sm leading-relaxed text-justify mb-3" style={{ color: '#1E2A3A' }}>
                El presente reporte consolida la información de seguimiento del Plan Operativo Institucional ({year}) correspondiente a {datosPorCC.length} Centros de Costo del Programa Nuestras Ciudades, abarcando el periodo de enero a {MESES[mesFin - 1].toLowerCase()} de {year}.
              </p>
              {(() => {
                const totPIA = datosPorCC.reduce((s, d) => s + d.cc.pia, 0);
                const totPIM = datosPorCC.reduce((s, d) => s + d.pim, 0);
                const totMods = datosPorCC.reduce((s, d) => s + d.totalMods, 0);
                const totActs = datosPorCC.reduce((s, d) => s + d.actsCC.length, 0);
                const variacionTot = totPIA > 0 ? ((totPIM - totPIA) / totPIA) * 100 : 0;
                return (
                  <div className="grid grid-cols-2 gap-2 p-4 rounded" style={{ background: '#FAF7F0', borderLeft: '4px solid #C9A350' }}>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>PIA total:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(totPIA)}</strong></div>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>PIM total:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(totPIM)}</strong></div>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Modificaciones:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(totMods)}</strong></div>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Variación:</span> <strong style={{ color: variacionTot > 0 ? '#2D7A4E' : '#1E2A3A' }}>{variacionTot >= 0 ? '+' : ''}{variacionTot.toFixed(2)}%</strong></div>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Total actividades:</span> <strong style={{ color: '#1E2A3A' }}>{totActs}</strong></div>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Centros de Costo:</span> <strong style={{ color: '#1E2A3A' }}>{datosPorCC.length}</strong></div>
                  </div>
                );
              })()}
            </ReportSection>

            {/* Iterar por cada CC */}
            {datosPorCC.map((d, idx) => (
              <div key={d.cc.codigo} className="mt-8 pt-6" style={{ borderTop: idx > 0 ? '2px dashed #C9A350' : 'none' }}>
                <div className="mb-4 p-3 rounded" style={{ background: '#1E2A3A' }}>
                  <div className="text-sm font-bold" style={{ color: '#C9A350' }}>
                    Centro de Costo {idx + 1}: {d.cc.codigo} — {d.cc.nombre}
                  </div>
                </div>

                <ReportSection num={`${idx + 2}.1`} title={`RESUMEN — ${d.cc.nombre}`}>
                  <p className="text-sm leading-relaxed text-justify" style={{ color: '#1E2A3A' }}>{d.cc.resumen}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 p-4 rounded" style={{ background: '#FAF7F0', borderLeft: '4px solid #C9A350' }}>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>PIA:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(d.cc.pia)}</strong></div>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>PIM al cierre:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(d.pim)}</strong></div>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Variación:</span> <strong style={{ color: d.variacion > 0 ? '#2D7A4E' : '#1E2A3A' }}>{d.variacion >= 0 ? '+' : ''}{d.variacion.toFixed(2)}%</strong></div>
                    <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Actividades:</span> <strong style={{ color: '#1E2A3A' }}>{d.actsCC.length}</strong></div>
                  </div>
                </ReportSection>

                <ReportSection num={`${idx + 2}.2`} title="Principales logros">
                  {d.reporteData.map(({ actividad, registros }) => (
                    <ActividadBloque key={actividad.id} actividad={actividad} registros={registros} campo="logros" mesesIncluir={mesesIncluir} />
                  ))}
                </ReportSection>

                <ReportSection num={`${idx + 2}.3`} title="Limitaciones">
                  {d.reporteData.map(({ actividad, registros }) => (
                    <ActividadBloque key={actividad.id} actividad={actividad} registros={registros} campo="limitaciones" mesesIncluir={mesesIncluir} />
                  ))}
                </ReportSection>

                <ReportSection num={`${idx + 2}.4`} title="Medidas adoptadas">
                  {d.reporteData.map(({ actividad, registros }) => (
                    <ActividadBloque key={actividad.id} actividad={actividad} registros={registros} campo="medidas" mesesIncluir={mesesIncluir} />
                  ))}
                </ReportSection>

                <ReportSection num={`${idx + 2}.5`} title="Modificaciones presupuestales">
                  {mesesIncluir.map(m => {
                    const monthMods = d.modsCC.filter(x => x.mes === m);
                    if (monthMods.length === 0) return null;
                    return (
                      <div key={m} className="mb-4">
                        <div className="text-sm font-semibold mb-2" style={{ color: '#9C7A2B' }}>{MESES[m - 1]}</div>
                        <ModifTablaPorAOI mods={monthMods} acts={d.actsCC} />
                      </div>
                    );
                  })}
                </ReportSection>
              </div>
            ))}
          </>
        ) : (
          // ============ Vista de UN solo CC ============
          <>
        <ReportSection num="I" title="RESUMEN EJECUTIVO">
          <p className="text-sm leading-relaxed text-justify" style={{ color: '#1E2A3A' }}>{cc.resumen}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 p-4 rounded" style={{ background: '#FAF7F0', borderLeft: '4px solid #C9A350' }}>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>PIA:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(cc.pia)}</strong></div>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>PIM al cierre:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(pim)}</strong></div>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Variación:</span> <strong style={{ color: variacion > 0 ? '#2D7A4E' : '#1E2A3A' }}>{variacion >= 0 ? '+' : ''}{variacion.toFixed(2)}%</strong></div>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Actividades:</span> <strong style={{ color: '#1E2A3A' }}>{acts.length}</strong></div>
          </div>
        </ReportSection>

        <ReportSection num="II" title="PRINCIPALES LOGROS">
          {reporteData.map(({ actividad, registros }) => (
            <ActividadBloque key={actividad.id} actividad={actividad} registros={registros} campo="logros" mesesIncluir={mesesIncluir} />
          ))}
        </ReportSection>

        <ReportSection num="III" title="LIMITACIONES">
          {reporteData.map(({ actividad, registros }) => (
            <ActividadBloque key={actividad.id} actividad={actividad} registros={registros} campo="limitaciones" mesesIncluir={mesesIncluir} />
          ))}
        </ReportSection>

        <ReportSection num="IV" title="MEDIDAS ADOPTADAS PARA CUMPLIR LAS METAS">
          {reporteData.map(({ actividad, registros }) => (
            <ActividadBloque key={actividad.id} actividad={actividad} registros={registros} campo="medidas" mesesIncluir={mesesIncluir} />
          ))}
        </ReportSection>

        <ReportSection num="V" title="MODIFICACIONES PRESUPUESTALES">
          {mesesIncluir.map(m => {
            const monthMods = modsCC.filter(x => x.mes === m);
            const modsHastaMes = modifs.filter(x => x.centroCosto === ccSel && x.anio === year && x.mes <= m)
              .reduce((s, x) => s + (Number(x.importe) || 0), 0);
            const pimMes = cc.pia + modsHastaMes;
            const varMes = cc.pia > 0 ? ((pimMes - cc.pia) / cc.pia) * 100 : 0;

            return (
              <div key={m} className="mb-6">
                <div className="text-sm font-semibold mb-2" style={{ color: '#9C7A2B' }}>{MESES[m - 1]}</div>
                <p className="text-sm leading-relaxed text-justify mb-3" style={{ color: '#1E2A3A' }}>
                  El Centro de Costo {cc.codigo} - {cc.nombre} al cierre del mes de {MESES[m - 1].toLowerCase()} {year}, contó con un PIA de <strong>{fmtMoney(cc.pia)}</strong> y un PIM de <strong>{fmtMoney(pimMes)}</strong>, representando un incremento/disminución de <strong>{varMes.toFixed(2)}%</strong> del PIA.
                </p>
                {monthMods.length === 0 ? (
                  <p className="text-sm italic" style={{ color: '#7A6F5C' }}>
                    En el mes de {MESES[m - 1].toLowerCase()} no se aprobaron modificaciones presupuestales.
                  </p>
                ) : (
                  <ModifTablaPorAOI mods={monthMods} acts={acts} />
                )}
              </div>
            );
          })}
        </ReportSection>
          </>
        )}
      </Card>
    </>
  );
}

/* ============================================================
   INFORME TÉCNICO POI — Modelo oficial PNC
   Dos tipos:
   1. Mensual: del mes filtrado (Introducción, Base Legal, Análisis, Conclusiones)
   2. Acumulado: todos los meses del año (mismo formato + evolución mensual)
============================================================ */
function InformeTecnico({ activities, progress, modifs, currentUser }) {
  const [tipoInforme, setTipoInforme] = useState('mensual'); // 'mensual' o 'acumulado'
  const [year, setYear] = useState(2026);
  const [mes, setMes] = useState(3);

  // ============ ESTADOS EDITABLES DEL CUERPO DEL INFORME ============
  const numInformeAuto = String(Math.floor(Date.now() / 1000) % 9999999).padStart(7, '0');
  const fechaHoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  // Cabecera editable
  const [editCabecera, setEditCabecera] = useState(false);
  const [numInforme, setNumInforme] = useState(numInformeAuto);
  const [siglas, setSiglas] = useState(currentUser?.usuario || 'jccanto');
  const [dirigidoA, setDirigidoA] = useState('Econ. Rosa Malaspina Pando');
  const [dirigidoCargo, setDirigidoCargo] = useState('Coordinadora (e) Área de Planeamiento y Presupuesto - Programa Nuestras Ciudades');
  const [referencia1, setReferencia1] = useState(`Memorando Múltiple N° 034-${year}-VIVIENDA/SG-OGPP`);
  const [referencia2, setReferencia2] = useState(`Resolución Ministerial N° 363-2025-VIVIENDA que aprueba el POI Anual ${year} consistente con el PIA ${year} del Pliego 037: MVCS`);
  const [fechaInforme, setFechaInforme] = useState(`San Isidro, ${fechaHoy}`);

  // Introducción editable
  const [editIntro, setEditIntro] = useState(false);
  const [intro11, setIntro11] = useState('');
  const [intro12, setIntro12] = useState('El Centro Nacional de Planeamiento Estratégico, en el artículo 7° de la Directiva N° 001-2017-CEPLAN/PCD, establece que las políticas institucionales se concretan en los planes estratégicos institucionales-PEI y los planes operativos institucionales-POI.');
  const [intro13, setIntro13] = useState('El POI establece las Actividades Operativas priorizadas vinculadas al cumplimiento de los Objetivos y Acciones Estratégicas Institucionales.');

  // Auto-actualizar 1.1 y referencias cuando cambien año/mes/tipo
  useEffect(() => {
    const periodoIntro = tipoInforme === 'mensual'
      ? `correspondiente al mes de ${MESES[mes - 1].toLowerCase()} de ${year}`
      : `acumulado al mes de ${MESES[mes - 1].toLowerCase()} de ${year}`;
    setIntro11(`En atención a los documentos de la referencia, se presenta el informe de seguimiento del Plan Operativo Institucional (POI) del Programa Nuestras Ciudades (PNC), ${periodoIntro}. El presente documento detalla el análisis del avance en la ejecución de las metas físicas y financieras, los logros alcanzados, las limitaciones identificadas y las medidas adoptadas.`);
  }, [year, mes, tipoInforme]);

  const ccDisponibles = ccsVisibles(currentUser);
  const ccsParaReporte = CENTROS_COSTO.filter(c => ccDisponibles.includes(c.nombre));

  // ============ CÁLCULO DE INDICADORES ============
  function calcularIndicadoresCC(ccNombre) {
    const ccObj = CENTROS_COSTO.find(c => c.nombre === ccNombre);
    const actsCC = activities.filter(a => a.centroCosto === ccNombre);

    let segsCC = progress.filter(p => {
      const act = activities.find(a => a.id === p.actividadId);
      return act && act.centroCosto === ccNombre && p.anio === year;
    });
    let modsCC = modifs.filter(m => m.centroCosto === ccNombre && m.anio === year);

    if (tipoInforme === 'mensual') {
      // Solo el mes seleccionado
      segsCC = segsCC.filter(s => s.mes === mes);
      modsCC = modsCC.filter(m => m.mes === mes);
    } else {
      // Acumulado: desde enero hasta el mes seleccionado (inclusive)
      segsCC = segsCC.filter(s => s.mes <= mes);
      modsCC = modsCC.filter(m => m.mes <= mes);
    }

    const pia = ccObj ? ccObj.pia : 0;
    const totalMods = modifs.filter(m => m.centroCosto === ccNombre && m.anio === year && m.mes <= mes)
      .reduce((s, m) => s + (Number(m.importe) || 0), 0);
    const pim = pia + totalMods;
    const ejecFin = segsCC.reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
    const ejecFis = segsCC.reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);

    // Meta física programada
    let metaFisProg = 0;
    if (tipoInforme === 'mensual') {
      // Solo el mes seleccionado
      const campoMes = `fis_${MESES_ABR[mes - 1].toLowerCase()}`;
      metaFisProg = actsCC.reduce((s, a) => s + (Number(a[campoMes]) || 0), 0);
    } else {
      // Acumulado: suma de enero hasta el mes seleccionado
      for (let m = 1; m <= mes; m++) {
        const campoMes = `fis_${MESES_ABR[m - 1].toLowerCase()}`;
        metaFisProg += actsCC.reduce((s, a) => s + (Number(a[campoMes]) || 0), 0);
      }
    }

    const pctFin = pim > 0 ? (ejecFin / pim) * 100 : 0;
    const pctFis = metaFisProg > 0 ? (ejecFis / metaFisProg) * 100 : 0;

    return {
      nombre: ccNombre, codigo: ccObj?.codigo || '', pia, totalMods, pim,
      ejecFin, ejecFis, pctFin, pctFis, metaFisProg,
      actividades: actsCC.length, seguimientos: segsCC, actividadesData: actsCC,
      modificaciones: modsCC,
    };
  }

  const indicadoresPorCC = ccsParaReporte
    .map(cc => calcularIndicadoresCC(cc.nombre))
    .filter(i => i.actividades > 0);

  // Totales generales
  const totales = {
    pia: indicadoresPorCC.reduce((s, i) => s + i.pia, 0),
    totalMods: indicadoresPorCC.reduce((s, i) => s + i.totalMods, 0),
    pim: indicadoresPorCC.reduce((s, i) => s + i.pim, 0),
    ejecFin: indicadoresPorCC.reduce((s, i) => s + i.ejecFin, 0),
    ejecFis: indicadoresPorCC.reduce((s, i) => s + i.ejecFis, 0),
    actividades: indicadoresPorCC.reduce((s, i) => s + i.actividades, 0),
  };
  totales.pctFin = totales.pim > 0 ? (totales.ejecFin / totales.pim) * 100 : 0;
  const pctFisList = indicadoresPorCC.map(i => i.pctFis);
  totales.pctFis = pctFisList.length > 0 ? pctFisList.reduce((a, b) => a + b, 0) / pctFisList.length : 0;

  // Evolución mensual (solo para acumulado) - hasta el mes seleccionado
  const evolucionMensual = [];
  if (tipoInforme === 'acumulado') {
    // Pre-calcular actividades filtradas por permisos del usuario
    const actsFiltradas = esResponsableCC(currentUser) ? filtrarActividadesUsuario(activities, currentUser) : activities;
    const idsFiltradas = new Set(actsFiltradas.map(a => a.id));

    // Acumulado va de enero hasta el mes seleccionado (mes)
    for (let m = 1; m <= mes; m++) {
      const mAbr = MESES_ABR[m - 1].toLowerCase();
      const segMes = progress.filter(p => p.anio === year && p.mes === m && idsFiltradas.has(p.actividadId));

      // Ejecutado
      const ejecFin = segMes.reduce((s, p) => s + (Number(p.avanceFinanciero) || 0), 0);
      const ejecFis = segMes.reduce((s, p) => s + (Number(p.avanceFisico) || 0), 0);

      // Programado mensual (de la programación de las actividades)
      const progFin = actsFiltradas.reduce((s, a) => s + (Number(a[`fin_${mAbr}`]) || 0), 0);
      const progFis = actsFiltradas.reduce((s, a) => s + (Number(a[`fis_${mAbr}`]) || 0), 0);

      evolucionMensual.push({
        mes: m,
        mesNombre: MESES[m - 1],
        ejecutado: ejecFin,
        ejecFinanciero: ejecFin,
        ejecFisico: ejecFis,
        progFinanciero: progFin,
        progFisico: progFis,
        registros: segMes.length,
      });
    }
  }

  // Recolección de logros y limitaciones
  /**
   * Construye un resumen consolidado del análisis del CC.
   * Describe la ejecución general SIN entrar en detalle por actividad/mes.
   * Solo cuenta actividades con avance físico > 0.
   */
  function construirResumenCC(ind, periodoTexto) {
    // Actividades con avance físico
    const actsConAvance = new Set();
    let avanceFisicoTotal = 0;
    ind.seguimientos.forEach(s => {
      const avf = Number(s.avanceFisico) || 0;
      if (avf > 0) {
        actsConAvance.add(s.actividadId);
        avanceFisicoTotal += avf;
      }
    });

    const totalActs = ind.actividades;
    const conAvance = actsConAvance.size;

    let resumen = `${periodoTexto} se tiene una ejecución financiera de S/ ${ind.ejecFin.toLocaleString('es-PE', { minimumFractionDigits: 2 })} `;
    resumen += `que representa el ${ind.pctFin.toFixed(2)}% del PIM. `;
    resumen += `Se registró un avance físico promedio de ${ind.pctFis.toFixed(2)}%. `;

    if (conAvance === 0) {
      resumen += `No se registraron avances físicos en las actividades durante el período evaluado.`;
    } else if (conAvance === totalActs) {
      resumen += `Se registraron avances en las ${totalActs} actividades del centro de costo.`;
    } else {
      resumen += `De las ${totalActs} actividades del centro de costo, ${conAvance} presentaron avance físico durante el período.`;
    }

    return resumen;
  }

  // Compatibilidad: stub que devuelve vacío (limitaciones ya no se muestran)
  function recolectarLimitaciones() { return []; }

  /**
   * Devuelve los logros más relevantes del centro de costo.
   * Reglas:
   * 1. Solo considera seguimientos donde la actividad tuvo avance físico > 0
   * 2. Agrupa por actividad (no se repite la misma actividad por mes)
   * 3. Ordena por avance físico acumulado (mayor impacto primero)
   * 4. Devuelve máximo 5 logros más relevantes
   */
  function recolectarLogros(seguimientos, actsData) {
    // Agrupar por actividad: cada actividad con su avance total y todos sus textos de logros
    const porActividad = {};
    seguimientos.forEach(s => {
      const avanceFis = Number(s.avanceFisico) || 0;
      if (avanceFis <= 0) return; // ignorar seguimientos sin avance físico
      const act = actsData.find(a => a.id === s.actividadId);
      if (!act) return;
      const textoLogro = String(s.logros || '').trim();
      if (!textoLogro) return;

      if (!porActividad[act.id]) {
        porActividad[act.id] = {
          codigoAOI: act.codigoAOI,
          nombre: act.nombre,
          area: act.area,
          unidadMedida: act.unidadMedida,
          avanceFisAcum: 0,
          avanceFinAcum: 0,
          textos: [],
        };
      }
      porActividad[act.id].avanceFisAcum += avanceFis;
      porActividad[act.id].avanceFinAcum += Number(s.avanceFinanciero) || 0;
      porActividad[act.id].textos.push({ mes: s.mes, texto: textoLogro });
    });

    // Ordenar por avance físico acumulado descendente y tomar los 5 más relevantes
    const lista = Object.values(porActividad)
      .sort((a, b) => b.avanceFisAcum - a.avanceFisAcum)
      .slice(0, 5);

    // Consolidar el texto de cada actividad (combinar de varios meses si existen)
    return lista.map(item => ({
      codigoAOI: item.codigoAOI,
      nombre: item.nombre,
      area: item.area,
      unidadMedida: item.unidadMedida,
      avanceFisAcum: item.avanceFisAcum,
      avanceFinAcum: item.avanceFinAcum,
      // Toma el texto más completo (más largo) si hay varios, evitando duplicaciones
      texto: item.textos.length === 1
        ? item.textos[0].texto
        : item.textos.sort((x, y) => y.texto.length - x.texto.length)[0].texto,
    }));
  }

  // ============ EXPORTACIÓN A WORD ============
  function exportarWord() {
    const html = construirHTMLInforme();
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sufijo = tipoInforme === 'mensual' ? `${MESES_ABR[mes - 1]}_${year}` : `Acumulado_a_${MESES_ABR[mes - 1]}_${year}`;
    link.download = `Informe_Tecnico_POI_${sufijo}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Descripciones institucionales por CC (tomadas del informe oficial)
  const descripcionesCC = {
    'GESTIÓN PNC': 'Esta unidad se encarga de asegurar la planificación, ejecución, monitoreo y evaluación eficiente de los proyectos de inversión pública en infraestructura urbana y saneamiento a nivel nacional. La Gestión del Programa se enfoca en la gestión administrativa, financiera, técnica y operativa, garantizando la correcta asignación de recursos, el cumplimiento de los plazos establecidos y la calidad de las obras, contribuyendo así al desarrollo sostenible de las ciudades peruanas y la mejora de la calidad de vida de sus habitantes.',
    'UGEDEUS': 'Unidad de Gestión del Desarrollo Urbano Sostenible. Se encarga de desarrollar estudios, brindar asistencia técnica y promover la gestión del desarrollo urbano sostenible a nivel nacional.',
    'UGERDES': 'Unidad de Gestión del Riesgo de Desastres y PNC-Maquinarias. Desarrolla acciones de prevención, reducción de riesgos y atención de emergencias a nivel nacional.',
    'UNINDEUS': 'Unidad de Inversiones en Desarrollo Urbano Sostenible y Proyectos de Inversión pública. Promueve y gestiona los proyectos de inversión pública del PNC.',
  };

  function construirHTMLInforme() {
    const periodoTexto = tipoInforme === 'mensual'
      ? `al mes de ${MESES[mes - 1].toLowerCase()} ${year}`
      : `acumulado al mes de ${MESES[mes - 1].toLowerCase()} ${year}`;

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe Técnico POI</title>
<style>
body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; margin: 2cm; color: #000; }
.center { text-align: center; }
.bold { font-weight: bold; }
.italic { font-style: italic; }
h1, h2, h3 { font-family: Arial, sans-serif; color: #1E2A3A; }
h1 { font-size: 14pt; margin-top: 18px; margin-bottom: 10px; }
h2 { font-size: 12pt; margin-top: 16px; margin-bottom: 8px; }
h3 { font-size: 11pt; margin-top: 12px; margin-bottom: 6px; }
table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 10pt; }
th { background: #1E2A3A; color: #fff; padding: 6px; text-align: left; }
td { border: 1px solid #ccc; padding: 5px; }
ul { margin: 6px 0 10px 0; padding-left: 22px; }
li { margin-bottom: 4px; text-align: justify; }
.bloque-info { padding: 10px; background: #FAF7F0; border-left: 3px solid #C9A350; margin: 10px 0; }
p { text-align: justify; margin: 6px 0; }
</style></head><body>`;

    // Cabecera oficial (EDITABLE por el usuario)
    html += `<p class="center italic">"Decenio de la Igualdad de Oportunidades para mujeres y hombres"</p>`;
    html += `<p class="center italic">"Año de la Esperanza y el Fortalecimiento de la Democracia"</p>`;
    html += `<br><p class="center bold" style="font-size:12pt">INFORME TÉCNICO N° ${numInforme}-${year}-VIVIENDA/VMVU/PNC/APP - ${siglas}</p><br>`;
    html += `<p><strong>A:</strong> ${dirigidoA}<br>&nbsp;&nbsp;&nbsp;&nbsp;${dirigidoCargo}</p>`;
    html += `<p><strong>ASUNTO:</strong> Seguimiento del Plan Operativo Institucional ${year} del pliego 037 – MVCS – ${periodoTexto}.</p>`;
    html += `<p><strong>REFERENCIA:</strong><br>- ${referencia1}<br>- ${referencia2}</p>`;
    html += `<p><strong>FECHA:</strong> ${fechaInforme}</p><br>`;
    html += `<p>Tengo el agrado de dirigirme a usted, en relación a los documentos de la referencia mediante los cuales se solicitó el seguimiento del Plan Operativo Institucional ${periodoTexto}.</p>`;
    html += `<p>Sobre el particular debo manifestarle lo siguiente:</p>`;

    // I. INTRODUCCIÓN (EDITABLE)
    html += `<h1>I. INTRODUCCIÓN</h1>`;
    html += `<p><strong>1.1</strong> ${intro11}</p>`;
    html += `<p><strong>1.2</strong> ${intro12}</p>`;
    html += `<p><strong>1.3</strong> ${intro13}</p>`;

    // II. BASE LEGAL
    html += `<h1>II. BASE LEGAL</h1>`;
    html += `<p><strong>2.1</strong> Decreto Legislativo 1440 del Sistema Nacional de Presupuesto Público.</p>`;
    html += `<p><strong>2.2</strong> Guía para el seguimiento y evaluación de políticas nacionales y planes del SINAPLAN aprobada por Resolución de Presidencia de Consejo Directivo N° 00015-2021-CEPLAN/PCD.</p>`;
    html += `<p><strong>2.3</strong> Guía para el Planeamiento Institucional modificada por Resolución de Presidencia del Consejo Directivo N° 0016-2019/CEPLAN/PCD.</p>`;
    html += `<p><strong>2.4</strong> Resolución Ministerial N° 151-2024-VIVIENDA, aprueba el "Plan Estratégico Institucional 2024-2030 del Ministerio de Vivienda, Construcción y Saneamiento".</p>`;
    html += `<p><strong>2.5</strong> Resolución Ministerial N° 363-2025-VIVIENDA, aprueba el "Plan Operativo Institucional ${year}-Consistenciado del Ministerio de Vivienda, Construcción y Saneamiento".</p>`;

    // III. ANÁLISIS
    html += `<h1>III. ANÁLISIS</h1>`;
    html += `<h2>3.1. Resumen General del Programa</h2>`;
    const periodoAnal = tipoInforme === 'mensual'
      ? `Al cierre del mes de ${MESES[mes - 1].toLowerCase()} de ${year}`
      : `Al período acumulado al mes de ${MESES[mes - 1].toLowerCase()} de ${year}`;
    html += `<p>${periodoAnal}, el Programa Nuestras Ciudades (PNC) tiene el Presupuesto Institucional Modificado (PIM) que asciende a <strong>${fmtMoney(totales.pim)}</strong> de los cuales se tiene un avance de ejecución financiera el importe de <strong>${fmtMoney(totales.ejecFin)}</strong>, que representa un avance de ejecución de <strong>${totales.pctFin.toFixed(2)}%</strong>. Por otro lado, se tiene una ejecución de meta física promedio de <strong>${totales.pctFis.toFixed(2)}%</strong> de las actividades operativas e inversiones.</p>`;

    // Tabla resumen
    html += `<table><tr><th>Indicador</th><th>Valor</th></tr>`;
    html += `<tr><td>Presupuesto Institucional de Apertura (PIA)</td><td>${fmtMoney(totales.pia)}</td></tr>`;
    html += `<tr><td>Modificaciones presupuestales</td><td>${fmtMoney(totales.totalMods)}</td></tr>`;
    html += `<tr><td>Presupuesto Institucional Modificado (PIM)</td><td>${fmtMoney(totales.pim)}</td></tr>`;
    html += `<tr><td>Ejecución financiera</td><td>${fmtMoney(totales.ejecFin)}</td></tr>`;
    html += `<tr><td>% Avance financiero</td><td>${totales.pctFin.toFixed(2)}%</td></tr>`;
    html += `<tr><td>% Avance físico promedio</td><td>${totales.pctFis.toFixed(2)}%</td></tr>`;
    html += `<tr><td>Total actividades operativas</td><td>${totales.actividades}</td></tr>`;
    html += `</table>`;

    // Evolución mensual (solo acumulado)
    if (tipoInforme === 'acumulado') {
      html += `<h3>Evolución mensual de la ejecución financiera</h3>`;
      html += `<table><tr><th>Mes</th><th>Ejecución Financiera</th><th>Registros</th></tr>`;
      evolucionMensual.forEach(e => {
        if (e.ejecutado > 0 || e.registros > 0) {
          html += `<tr><td>${e.mesNombre}</td><td>${fmtMoney(e.ejecutado)}</td><td>${e.registros}</td></tr>`;
        }
      });
      html += `</table>`;
    }

    // 3.2 Por Centro de Costo
    html += `<h2>3.2. Avance por Unidades (Centros de Costo)</h2>`;
    html += `<p>A continuación, se presenta el desglose del avance físico y financiero por cada unidad responsable del programa.</p>`;

    indicadoresPorCC.forEach((ind, idx) => {
      const desc = descripcionesCC[ind.nombre] || '';
      html += `<h3>3.2.${idx + 1}. ${ind.nombre}</h3>`;
      if (desc) html += `<p>${desc}</p>`;

      const periodoCC = tipoInforme === 'mensual'
        ? `En el mes de ${MESES[mes - 1].toLowerCase()} de ${year}`
        : `En el período acumulado al mes de ${MESES[mes - 1].toLowerCase()} de ${year}`;

      // Resumen consolidado del CC (no detalla actividad por mes)
      const resumenTexto = construirResumenCC(ind, periodoCC);
      html += `<p><strong>Resumen de resultados:</strong> ${resumenTexto}</p>`;

      // Tabla del CC
      html += `<table><tr><th>Indicador</th><th>Valor</th></tr>`;
      html += `<tr><td>PIA</td><td>${fmtMoney(ind.pia)}</td></tr>`;
      html += `<tr><td>Modificaciones</td><td>${fmtMoney(ind.totalMods)}</td></tr>`;
      html += `<tr><td>PIM</td><td>${fmtMoney(ind.pim)}</td></tr>`;
      html += `<tr><td>Ejecución financiera</td><td>${fmtMoney(ind.ejecFin)}</td></tr>`;
      html += `<tr><td>% Avance financiero</td><td>${ind.pctFin.toFixed(2)}%</td></tr>`;
      html += `<tr><td>Meta física programada</td><td>${ind.metaFisProg.toFixed(2)}</td></tr>`;
      html += `<tr><td>Ejecución física</td><td>${ind.ejecFis.toFixed(2)}</td></tr>`;
      html += `<tr><td>% Avance físico</td><td>${ind.pctFis.toFixed(2)}%</td></tr>`;
      html += `<tr><td>N° actividades</td><td>${ind.actividades}</td></tr>`;
      html += `</table>`;

      // Logros: solo los 3-5 más relevantes (ya filtrados sin avance == 0)
      const logros = recolectarLogros(ind.seguimientos, ind.actividadesData);
      if (logros.length > 0) {
        html += `<p><strong>Principales logros:</strong></p><ul>`;
        logros.forEach(l => {
          html += `<li><strong>${l.codigoAOI}</strong> (${l.unidadMedida || ''}, avance acumulado: ${l.avanceFisAcum.toFixed(2)}): ${l.texto}</li>`;
        });
        html += `</ul>`;
      }
    });

    // IV. CONCLUSIONES Y RECOMENDACIONES
    html += `<h1>IV. CONCLUSIONES Y RECOMENDACIONES</h1>`;
    html += `<h2>4.1 Conclusiones</h2>`;
    const periodoConcl = tipoInforme === 'mensual'
      ? `al culminar el mes de ${MESES[mes - 1].toLowerCase()} de ${year}`
      : `al período acumulado al mes de ${MESES[mes - 1].toLowerCase()} de ${year}`;
    html += `<p><strong>4.1.1</strong> El Programa Nuestras Ciudades, ${periodoConcl} ha alcanzado una ejecución presupuestal de <strong>${fmtMoney(totales.ejecFin)}</strong> que representa el <strong>${totales.pctFin.toFixed(2)}%</strong> del PIM. Asimismo, se tiene un avance de la ejecución física promedio de <strong>${totales.pctFis.toFixed(2)}%</strong> en referencia a la programación.</p>`;
    html += `<p><strong>4.1.2</strong> Se ha cumplido con el registro de la información de seguimiento en el aplicativo CEPLAN V.01, conforme a la normativa vigente.</p>`;
    html += `<p><strong>4.1.3</strong> La trazabilidad de las acciones queda registrada en la bitácora del Sistema de Seguimiento POI del PNC.</p>`;

    html += `<h2>4.2 Recomendaciones</h2>`;
    html += `<p><strong>4.2.1</strong> Se recomienda remitir el presente informe y sus anexos a la Oficina General de Planeamiento y Presupuesto del Ministerio de Vivienda, Construcción y Saneamiento, para los fines correspondientes.</p>`;
    html += `<p><strong>4.2.2</strong> Continuar con el seguimiento mensual de las actividades operativas conforme al cronograma establecido.</p>`;
    html += `<p><strong>4.2.3</strong> Fortalecer las coordinaciones con los responsables de cada centro de costo para mantener el ritmo de ejecución.</p>`;

    html += `<br><p>Es todo cuanto informo a usted para su conocimiento.</p><br>`;
    html += `<p>Atentamente,</p><br><br>`;
    if (currentUser) {
      html += `<p><strong>${currentUser.nombre}</strong><br>`;
      html += `${currentUser.cargo || 'Especialista'}<br>`;
      html += `Programa Nuestras Ciudades</p>`;
    }

    html += `</body></html>`;
    return html;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 p-4 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #FBF1D9 0%, #F5E5B8 100%)',
          border: '1px solid #C9A350',
        }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full"
            style={{ background: 'linear-gradient(135deg, #C9A350 0%, #E5C66D 100%)' }}>
            <span style={{ fontSize: 20 }}>✨</span>
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2" style={{ color: '#1E2A3A' }}>
              Informe Técnico generado con IA
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: '#1E2A3A', color: '#C9A350' }}>
                ✨ IA
              </span>
            </div>
            <div className="text-xs" style={{ color: '#7A6F5C' }}>
              El sistema usa inteligencia artificial para analizar los datos del seguimiento y redactar automáticamente el informe técnico oficial.
            </div>
          </div>
        </div>
        <button onClick={exportarWord}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
          style={{ background: '#1E2A3A', color: '#C9A350' }}>
          <Download size={16} /> Exportar a Word
        </button>
      </div>

      {/* Selector de tipo de informe */}
      <Card className="p-5 mb-4">
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7A6F5C' }}>
          Tipo de informe
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setTipoInforme('mensual')}
            className="p-4 rounded-md text-left transition-all"
            style={{
              background: tipoInforme === 'mensual' ? '#FBF1D9' : '#FFFFFF',
              border: tipoInforme === 'mensual' ? '2px solid #C9A350' : '2px solid #E5DDD0',
              cursor: 'pointer',
            }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: '#1E2A3A', fontWeight: 600, fontSize: 14 }}>
              📅 Informe Mensual
            </div>
            <div className="text-xs" style={{ color: '#7A6F5C' }}>
              Análisis del seguimiento POI de un mes específico
            </div>
          </button>

          <button onClick={() => setTipoInforme('acumulado')}
            className="p-4 rounded-md text-left transition-all"
            style={{
              background: tipoInforme === 'acumulado' ? '#FBF1D9' : '#FFFFFF',
              border: tipoInforme === 'acumulado' ? '2px solid #C9A350' : '2px solid #E5DDD0',
              cursor: 'pointer',
            }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: '#1E2A3A', fontWeight: 600, fontSize: 14 }}>
              📊 Informe Acumulado
            </div>
            <div className="text-xs" style={{ color: '#7A6F5C' }}>
              Análisis acumulado desde enero hasta el mes seleccionado
            </div>
          </button>
        </div>
      </Card>

      <Card className="p-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Año">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls}>
              {ANIOS_DISPONIBLES.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label={tipoInforme === 'mensual' ? 'Mes' : 'Acumulado hasta el mes de'}>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className={inputCls}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </Field>
        </div>
        {tipoInforme === 'acumulado' && (
          <div className="mt-2 text-xs italic" style={{ color: '#7A6F5C' }}>
            El informe acumulado incluirá los meses de <strong>enero</strong> a <strong>{MESES[mes - 1].toLowerCase()}</strong> de {year}.
          </div>
        )}
      </Card>

      {/* PREVISUALIZACIÓN DEL INFORME */}
      <Card className="p-8">
        {/* Toggle editar cabecera */}
        <div className="flex justify-end mb-2">
          <button onClick={() => setEditCabecera(!editCabecera)}
            className="text-xs px-3 py-1 rounded-md font-semibold flex items-center gap-1"
            style={{ background: editCabecera ? '#2D7A4E' : '#F0E9D9', color: editCabecera ? '#FFF' : '#1E2A3A' }}>
            {editCabecera ? '✓ Guardar cabecera' : '✏️ Editar cabecera'}
          </button>
        </div>

        {/* Cabecera oficial */}
        <div className="text-center mb-6" style={{ fontStyle: 'italic', fontSize: 10, color: '#7A6F5C' }}>
          <div>"Decenio de la Igualdad de Oportunidades para mujeres y hombres"</div>
          <div>"Año de la Esperanza y el Fortalecimiento de la Democracia"</div>
        </div>

        {/* Número de informe */}
        {editCabecera ? (
          <div className="mb-6 p-3 rounded" style={{ background: '#FBF1D9', border: '1px dashed #C9A350' }}>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>N° Informe</label>
                <input type="text" value={numInforme} onChange={(e) => setNumInforme(e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>Año</label>
                <input type="text" value={year} readOnly className={inputCls} style={{ background: '#F0E9D9' }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>Siglas / usuario</label>
                <input type="text" value={siglas} onChange={(e) => setSiglas(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-6">
            <div className="text-base font-bold" style={{ color: '#1E2A3A' }}>
              INFORME TÉCNICO N° {numInforme}-{year}-VIVIENDA/VMVU/PNC/APP - {siglas}
            </div>
          </div>
        )}

        {/* Dirigido a / Asunto / Referencia / Fecha */}
        {editCabecera ? (
          <div className="mb-6 space-y-3 p-3 rounded" style={{ background: '#FBF1D9', border: '1px dashed #C9A350' }}>
            <div>
              <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>Dirigido a (nombre)</label>
              <input type="text" value={dirigidoA} onChange={(e) => setDirigidoA(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>Cargo del destinatario</label>
              <input type="text" value={dirigidoCargo} onChange={(e) => setDirigidoCargo(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>Asunto (se genera automáticamente)</label>
              <input type="text" readOnly value={`Seguimiento del Plan Operativo Institucional ${year} del pliego 037 – MVCS – ${tipoInforme === 'mensual' ? `al mes de ${MESES[mes - 1].toLowerCase()} ${year}` : `acumulado al mes de ${MESES[mes - 1].toLowerCase()} ${year}`}.`} className={inputCls} style={{ background: '#F0E9D9' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>Referencia 1</label>
              <textarea rows={2} value={referencia1} onChange={(e) => setReferencia1(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>Referencia 2</label>
              <textarea rows={2} value={referencia2} onChange={(e) => setReferencia2(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>Fecha</label>
              <input type="text" value={fechaInforme} onChange={(e) => setFechaInforme(e.target.value)} className={inputCls} />
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed mb-4" style={{ color: '#1E2A3A' }}>
            <div className="mb-3"><strong>A:</strong> {dirigidoA}<br />
              <span className="ml-4">{dirigidoCargo}</span></div>
            <div className="mb-3"><strong>ASUNTO:</strong> Seguimiento del Plan Operativo Institucional {year} del pliego 037 – MVCS – {tipoInforme === 'mensual' ? `al mes de ${MESES[mes - 1].toLowerCase()} ${year}` : `acumulado al mes de ${MESES[mes - 1].toLowerCase()} ${year}`}.</div>
            <div className="mb-3"><strong>REFERENCIA:</strong><br />
              <span className="ml-4">- {referencia1}<br />
              - {referencia2}</span></div>
            <div className="mb-3"><strong>FECHA:</strong> {fechaInforme}</div>
          </div>
        )}

        <p className="text-sm text-justify mb-2" style={{ color: '#1E2A3A' }}>
          Tengo el agrado de dirigirme a usted, en relación a los documentos de la referencia mediante los cuales se solicitó el seguimiento del Plan Operativo Institucional {tipoInforme === 'mensual' ? `al mes de ${MESES[mes - 1].toLowerCase()} ${year}` : `acumulado al mes de ${MESES[mes - 1].toLowerCase()} ${year}`}.
        </p>
        <p className="text-sm text-justify mb-4" style={{ color: '#1E2A3A' }}>
          Sobre el particular debo manifestarle lo siguiente:
        </p>

        {/* Toggle editar introducción */}
        <div className="flex justify-end mb-2">
          <button onClick={() => setEditIntro(!editIntro)}
            className="text-xs px-3 py-1 rounded-md font-semibold flex items-center gap-1"
            style={{ background: editIntro ? '#2D7A4E' : '#F0E9D9', color: editIntro ? '#FFF' : '#1E2A3A' }}>
            {editIntro ? '✓ Guardar introducción' : '✏️ Editar introducción'}
          </button>
        </div>

        {/* I. INTRODUCCIÓN */}
        <ReportSection num="I" title="INTRODUCCIÓN">
          {editIntro ? (
            <div className="space-y-3 p-3 rounded" style={{ background: '#FBF1D9', border: '1px dashed #C9A350' }}>
              <div>
                <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>1.1 (se actualiza con año/mes automáticamente)</label>
                <textarea rows={4} value={intro11} onChange={(e) => setIntro11(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>1.2</label>
                <textarea rows={4} value={intro12} onChange={(e) => setIntro12(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase" style={{ color: '#7A6F5C' }}>1.3</label>
                <textarea rows={3} value={intro13} onChange={(e) => setIntro13(e.target.value)} className={inputCls} />
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-justify mb-3" style={{ color: '#1E2A3A' }}>
                <strong>1.1</strong> {intro11}
              </p>
              <p className="text-sm text-justify mb-3" style={{ color: '#1E2A3A' }}>
                <strong>1.2</strong> {intro12}
              </p>
              <p className="text-sm text-justify" style={{ color: '#1E2A3A' }}>
                <strong>1.3</strong> {intro13}
              </p>
            </>
          )}
        </ReportSection>

        {/* II. BASE LEGAL */}
        <ReportSection num="II" title="BASE LEGAL">
          <ul className="text-sm" style={{ color: '#1E2A3A' }}>
            <li className="mb-2"><strong>2.1</strong> Decreto Legislativo 1440 del Sistema Nacional de Presupuesto Público.</li>
            <li className="mb-2"><strong>2.2</strong> Resolución de Presidencia de Consejo Directivo N° 00015-2021-CEPLAN/PCD.</li>
            <li className="mb-2"><strong>2.3</strong> Resolución de Presidencia del Consejo Directivo N° 0016-2019/CEPLAN/PCD.</li>
            <li className="mb-2"><strong>2.4</strong> Resolución Ministerial N° 151-2024-VIVIENDA (PEI 2024-2030).</li>
            <li className="mb-2"><strong>2.5</strong> Resolución Ministerial N° 363-2025-VIVIENDA (POI {year}).</li>
          </ul>
        </ReportSection>

        {/* III. ANÁLISIS */}
        <ReportSection num="III" title="ANÁLISIS">
          <h3 className="text-sm font-bold mt-3 mb-2" style={{ color: '#1E2A3A' }}>3.1. Resumen General del Programa</h3>
          <p className="text-sm text-justify mb-3" style={{ color: '#1E2A3A' }}>
            {tipoInforme === 'mensual' ? `Al cierre del mes de ${MESES[mes - 1].toLowerCase()} de ${year}` : `Al período acumulado al mes de ${MESES[mes - 1].toLowerCase()} de ${year}`}, el Programa Nuestras Ciudades (PNC) tiene el Presupuesto Institucional Modificado (PIM) que asciende a <strong>{fmtMoney(totales.pim)}</strong> de los cuales se tiene un avance de ejecución financiera el importe de <strong>{fmtMoney(totales.ejecFin)}</strong>, que representa un avance de ejecución de <strong>{totales.pctFin.toFixed(2)}%</strong>. Por otro lado, se tiene una ejecución de meta física promedio de <strong>{totales.pctFis.toFixed(2)}%</strong>.
          </p>

          <div className="mb-4 grid grid-cols-3 gap-2 p-3 rounded" style={{ background: '#FAF7F0', borderLeft: '4px solid #C9A350' }}>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>PIA:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(totales.pia)}</strong></div>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Modificaciones:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(totales.totalMods)}</strong></div>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>PIM:</span> <strong style={{ color: '#1E2A3A' }}>{fmtMoney(totales.pim)}</strong></div>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>Ejecutado:</span> <strong style={{ color: '#2D7A4E' }}>{fmtMoney(totales.ejecFin)}</strong></div>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>% Financiero:</span> <strong style={{ color: '#1E2A3A' }}>{totales.pctFin.toFixed(2)}%</strong></div>
            <div className="text-xs"><span style={{ color: '#7A6F5C' }}>% Físico:</span> <strong style={{ color: '#1E2A3A' }}>{totales.pctFis.toFixed(2)}%</strong></div>
          </div>

          {/* ============================================================
             GRÁFICOS DEL RESUMEN GENERAL
             - Mensual: solo circular (donut)
             - Acumulado: circular + barras superpuestas
          ============================================================ */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Gráfico circular de avance financiero */}
            <div className="p-4 rounded" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
              <div className="text-xs font-semibold mb-2 text-center" style={{ color: '#1E2A3A' }}>📊 Avance de Ejecución Financiera</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: 'Ejecutado', value: Math.round(totales.ejecFin), fill: '#C9A350' },
                    { name: 'Por ejecutar', value: Math.max(0, Math.round(totales.pim - totales.ejecFin)), fill: '#E5DDD0' },
                  ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {[{ fill: '#C9A350' }, { fill: '#E5DDD0' }].map((e, i) => (<Cell key={i} fill={e.fill} />))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center text-xs mt-1" style={{ color: '#7A6F5C' }}>
                <strong style={{ color: '#1E2A3A', fontSize: 18 }}>{totales.pctFin.toFixed(2)}%</strong>
                <div>de ejecución del PIM ({fmtMoney(totales.pim)})</div>
              </div>
            </div>

            {/* Gráfico circular de avance físico */}
            <div className="p-4 rounded" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
              <div className="text-xs font-semibold mb-2 text-center" style={{ color: '#1E2A3A' }}>📈 Avance de Ejecución Física</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: 'Ejecutado', value: Math.min(100, Number(totales.pctFis.toFixed(2))), fill: '#2D7A4E' },
                    { name: 'Pendiente', value: Math.max(0, 100 - Number(totales.pctFis.toFixed(2))), fill: '#E5DDD0' },
                  ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {[{ fill: '#2D7A4E' }, { fill: '#E5DDD0' }].map((e, i) => (<Cell key={i} fill={e.fill} />))}
                  </Pie>
                  <Tooltip formatter={(v) => v + '%'} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center text-xs mt-1" style={{ color: '#7A6F5C' }}>
                <strong style={{ color: '#1E2A3A', fontSize: 18 }}>{totales.pctFis.toFixed(2)}%</strong>
                <div>de ejecución física promedio</div>
              </div>
            </div>
          </div>

          {/* Acumulado: SOLO acumulado tiene barras superpuestas del Resumen General */}
          {tipoInforme === 'acumulado' && (
            <div className="p-4 rounded mb-4" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: '#1E2A3A' }}>💰 PIM vs Ejecución por Centro de Costo</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={indicadoresPorCC.map(ind => ({
                  cc: ind.nombre.length > 14 ? ind.nombre.substring(0, 12) + '…' : ind.nombre,
                  ccCompleto: ind.nombre,
                  PIM: Math.round(ind.pim),
                  Ejecutado: Math.round(ind.ejecFin),
                }))} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" />
                  <XAxis dataKey="cc" tick={{ fontSize: 10, fill: '#1E2A3A' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#7A6F5C' }} tickFormatter={(v) => fmtMoneyShort(v)} />
                  <Tooltip formatter={(v) => fmtMoney(v)} labelFormatter={(l, p) => p[0]?.payload?.ccCompleto || l} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {/* barColor con barSize para superposición de Ejecutado sobre PIM */}
                  <Bar dataKey="PIM" fill="#1E2A3A" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="Ejecutado" fill="#C9A350" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Evolución mensual (acumulado) */}
          {tipoInforme === 'acumulado' && (
            <>
              <h3 className="text-sm font-bold mt-4 mb-2" style={{ color: '#1E2A3A' }}>📈 Evolución mensual de la ejecución</h3>
              <p className="text-xs mb-3" style={{ color: '#7A6F5C' }}>
                Comparativa mensual entre lo programado y lo ejecutado, tanto en avance físico como financiero.
              </p>

              {/* Gráfico FINANCIERO mensual: barras superpuestas Programado vs Ejecutado */}
              <div className="p-4 rounded mb-4" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#1E2A3A' }}>
                  💰 Avance FINANCIERO mensual (Programado vs Ejecutado)
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={evolucionMensual.map(e => ({
                    mes: MESES_ABR[e.mes - 1],
                    mesCompleto: e.mesNombre,
                    Programado: Math.round(e.progFinanciero),
                    Ejecutado: Math.round(e.ejecFinanciero),
                  }))} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#1E2A3A' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#7A6F5C' }} tickFormatter={(v) => fmtMoneyShort(v)} />
                    <Tooltip formatter={(v) => fmtMoney(v)} labelFormatter={(l, p) => p[0]?.payload?.mesCompleto || l} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {/* Superposición: Programado ancha + Ejecutado angosta encima */}
                    <Bar dataKey="Programado" fill="#1E2A3A" radius={[4, 4, 0, 0]} barSize={28} />
                    <Bar dataKey="Ejecutado" fill="#C9A350" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico FÍSICO mensual: barras superpuestas */}
              <div className="p-4 rounded mb-4" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#1E2A3A' }}>
                  📊 Avance FÍSICO mensual (Programado vs Ejecutado)
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={evolucionMensual.map(e => ({
                    mes: MESES_ABR[e.mes - 1],
                    mesCompleto: e.mesNombre,
                    Programado: Number(e.progFisico.toFixed(2)),
                    Ejecutado: Number(e.ejecFisico.toFixed(2)),
                  }))} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#1E2A3A' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#7A6F5C' }} />
                    <Tooltip labelFormatter={(l, p) => p[0]?.payload?.mesCompleto || l} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Programado" fill="#1E2A3A" radius={[4, 4, 0, 0]} barSize={28} />
                    <Bar dataKey="Ejecutado" fill="#2D7A4E" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla detallada de evolución */}
              <table className="w-full text-xs mb-4" style={{ borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#1E2A3A', color: '#fff' }}>
                  <th className="p-2 text-left">Mes</th>
                  <th className="p-2 text-right">Prog. Financ.</th>
                  <th className="p-2 text-right">Ejec. Financ.</th>
                  <th className="p-2 text-right">% Fin.</th>
                  <th className="p-2 text-right">Prog. Físico</th>
                  <th className="p-2 text-right">Ejec. Físico</th>
                  <th className="p-2 text-right">% Fís.</th>
                </tr></thead>
                <tbody>
                  {evolucionMensual.filter(e => e.ejecFinanciero > 0 || e.ejecFisico > 0 || e.progFinanciero > 0).map(e => {
                    const pctFin = e.progFinanciero > 0 ? (e.ejecFinanciero / e.progFinanciero * 100) : 0;
                    const pctFis = e.progFisico > 0 ? (e.ejecFisico / e.progFisico * 100) : 0;
                    return (
                      <tr key={e.mes} style={{ borderBottom: '1px solid #E5DDD0' }}>
                        <td className="p-2"><strong>{e.mesNombre}</strong></td>
                        <td className="p-2 text-right">{fmtMoney(e.progFinanciero)}</td>
                        <td className="p-2 text-right">{fmtMoney(e.ejecFinanciero)}</td>
                        <td className="p-2 text-right"><strong>{pctFin.toFixed(1)}%</strong></td>
                        <td className="p-2 text-right">{e.progFisico.toFixed(2)}</td>
                        <td className="p-2 text-right">{e.ejecFisico.toFixed(2)}</td>
                        <td className="p-2 text-right"><strong>{pctFis.toFixed(1)}%</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* 3.2 Por CC */}
          <h3 className="text-sm font-bold mt-4 mb-3" style={{ color: '#1E2A3A' }}>3.2. Avance por Unidades (Centros de Costo)</h3>
          <p className="text-sm text-justify mb-3" style={{ color: '#1E2A3A' }}>
            A continuación, se presenta el desglose del avance físico y financiero por cada unidad responsable del programa.
          </p>

          {indicadoresPorCC.map((ind, idx) => {
            const desc = descripcionesCC[ind.nombre] || '';
            const logros = recolectarLogros(ind.seguimientos, ind.actividadesData);
            const periodoCC = tipoInforme === 'mensual'
              ? `En el mes de ${MESES[mes - 1].toLowerCase()} de ${year}`
              : `En el período acumulado al mes de ${MESES[mes - 1].toLowerCase()} de ${year}`;
            const resumenConsolidado = construirResumenCC(ind, periodoCC);

            return (
              <div key={ind.nombre} className="mb-6 pb-4" style={{ borderBottom: '1px solid #E5DDD0' }}>
                <h4 className="text-sm font-bold mb-2" style={{ color: '#9C7A2B' }}>3.2.{idx + 1}. {ind.nombre}</h4>
                {desc && <p className="text-sm text-justify mb-2" style={{ color: '#1E2A3A' }}>{desc}</p>}

                <p className="text-sm text-justify mb-3 p-3 rounded" style={{ color: '#1E2A3A', background: '#FAF7F0', borderLeft: '3px solid #C9A350' }}>
                  <strong>Resumen de resultados:</strong> {resumenConsolidado}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded" style={{ background: '#FAF7F0', fontSize: 11 }}>
                  <div><span style={{ color: '#7A6F5C' }}>PIA:</span> <strong>{fmtMoney(ind.pia)}</strong></div>
                  <div><span style={{ color: '#7A6F5C' }}>PIM:</span> <strong>{fmtMoney(ind.pim)}</strong></div>
                  <div><span style={{ color: '#7A6F5C' }}>Ejec.:</span> <strong>{fmtMoney(ind.ejecFin)}</strong></div>
                  <div><span style={{ color: '#7A6F5C' }}>% Fin.:</span> <strong>{ind.pctFin.toFixed(2)}%</strong></div>
                  <div><span style={{ color: '#7A6F5C' }}>% Fís.:</span> <strong>{ind.pctFis.toFixed(2)}%</strong></div>
                  <div><span style={{ color: '#7A6F5C' }}>Activ.:</span> <strong>{ind.actividades}</strong></div>
                </div>

                {/* Gráfico PIM vs Ejecución */}
                <div className="p-3 rounded mb-3" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
                  <div className="text-[11px] font-semibold mb-2 text-center" style={{ color: '#1E2A3A' }}>
                    📊 PIM vs Ejecución
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[
                      {
                        categoria: 'Financiero',
                        Programado: Math.round(ind.pim),
                        Ejecutado: Math.round(ind.ejecFin),
                      },
                    ]} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" />
                      <XAxis dataKey="categoria" tick={{ fontSize: 10, fill: '#1E2A3A' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#7A6F5C' }} tickFormatter={(v) => fmtMoneyShort(v)} />
                      <Tooltip formatter={(v) => fmtMoney(v)} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Programado" fill="#1E2A3A" radius={[4, 4, 0, 0]} barSize={80} />
                      <Bar dataKey="Ejecutado" fill="#C9A350" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-center text-[11px]">
                    <div>
                      <div style={{ color: '#7A6F5C' }}>% Financiero</div>
                      <strong style={{ color: '#1E2A3A', fontSize: 14 }}>{ind.pctFin.toFixed(2)}%</strong>
                    </div>
                    <div>
                      <div style={{ color: '#7A6F5C' }}>% Físico</div>
                      <strong style={{ color: '#1E2A3A', fontSize: 14 }}>{ind.pctFis.toFixed(2)}%</strong>
                    </div>
                  </div>
                </div>

                {logros.length > 0 && (
                  <>
                    <p className="text-sm font-bold mb-1" style={{ color: '#1E2A3A' }}>
                      Principales logros:
                    </p>
                    <ul className="text-sm ml-4 mb-3" style={{ color: '#1E2A3A' }}>
                      {logros.map((l, i) => (
                        <li key={i} className="mb-2">
                          • <strong>{l.codigoAOI}</strong>
                          {l.unidadMedida && <span style={{ color: '#7A6F5C' }}> ({l.unidadMedida}, avance acumulado: {l.avanceFisAcum.toFixed(2)})</span>}
                          : {l.texto}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </ReportSection>

        {/* IV. CONCLUSIONES Y RECOMENDACIONES */}
        <ReportSection num="IV" title="CONCLUSIONES Y RECOMENDACIONES">
          <h3 className="text-sm font-bold mb-2" style={{ color: '#1E2A3A' }}>4.1 Conclusiones</h3>
          <p className="text-sm text-justify mb-2" style={{ color: '#1E2A3A' }}>
            <strong>4.1.1</strong> El Programa Nuestras Ciudades, {tipoInforme === 'mensual' ? `al culminar el mes de ${MESES[mes - 1].toLowerCase()} de ${year}` : `al período acumulado al mes de ${MESES[mes - 1].toLowerCase()} de ${year}`} ha alcanzado una ejecución presupuestal de <strong>{fmtMoney(totales.ejecFin)}</strong> que representa el <strong>{totales.pctFin.toFixed(2)}%</strong> del PIM. Asimismo, se tiene un avance de la ejecución física promedio de <strong>{totales.pctFis.toFixed(2)}%</strong>.
          </p>
          <p className="text-sm text-justify mb-2" style={{ color: '#1E2A3A' }}>
            <strong>4.1.2</strong> Se ha cumplido con el registro de la información de seguimiento en el aplicativo CEPLAN V.01.
          </p>
          <p className="text-sm text-justify mb-4" style={{ color: '#1E2A3A' }}>
            <strong>4.1.3</strong> La trazabilidad de las acciones queda registrada en la bitácora del sistema.
          </p>

          <h3 className="text-sm font-bold mb-2" style={{ color: '#1E2A3A' }}>4.2 Recomendaciones</h3>
          <p className="text-sm text-justify mb-2" style={{ color: '#1E2A3A' }}>
            <strong>4.2.1</strong> Se recomienda remitir el presente informe a la Oficina General de Planeamiento y Presupuesto del MVCS.
          </p>
          <p className="text-sm text-justify mb-2" style={{ color: '#1E2A3A' }}>
            <strong>4.2.2</strong> Continuar con el seguimiento mensual de las actividades operativas.
          </p>
          <p className="text-sm text-justify mb-4" style={{ color: '#1E2A3A' }}>
            <strong>4.2.3</strong> Fortalecer las coordinaciones con los responsables de cada centro de costo.
          </p>
        </ReportSection>

        <p className="text-sm mt-6 mb-4" style={{ color: '#1E2A3A' }}>Es todo cuanto informo a usted para su conocimiento.</p>
        <p className="text-sm mb-8" style={{ color: '#1E2A3A' }}>Atentamente,</p>

        {currentUser && (
          <div className="text-sm" style={{ color: '#1E2A3A' }}>
            <div className="font-bold">{currentUser.nombre}</div>
            <div>{currentUser.cargo || 'Especialista'}</div>
            <div>Programa Nuestras Ciudades</div>
          </div>
        )}
      </Card>
    </>
  );
}


function ReportSection({ num, title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-bold pb-2 mb-4" style={{ color: '#1E2A3A', borderBottom: '2px solid #C9A350' }}>
        {num}. {title}
      </h2>
      {children}
    </div>
  );
}

function ActividadBloque({ actividad, registros, campo, mesesIncluir }) {
  return (
    <div className="mb-5">
      <div className="mb-2">
        <span className="text-xs font-mono" style={{ color: '#9C7A2B' }}>{actividad.codigoAOI}: </span>
        <span className="text-sm font-semibold" style={{ color: '#1E2A3A' }}>{actividad.nombre}</span>
        <span className="text-xs ml-2" style={{ color: '#7A6F5C' }}>(UM: {actividad.unidadMedida})</span>
      </div>
      <div className="pl-4 space-y-2">
        {mesesIncluir.map(m => {
          const r = registros.find(x => x.mes === m);
          return (
            <div key={m}>
              <span className="text-xs font-semibold" style={{ color: '#9C7A2B' }}>{MESES[m - 1]}: </span>
              <span className="text-sm" style={{ color: '#1E2A3A' }}>
                {r?.[campo] || <em style={{ color: '#9C9080' }}>Sin registro para el periodo.</em>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModifTablaPorAOI({ mods, acts }) {
  const byAOI = {};
  mods.forEach(m => {
    if (!byAOI[m.codigoAOI]) byAOI[m.codigoAOI] = [];
    byAOI[m.codigoAOI].push(m);
  });
  return (
    <div className="space-y-4">
      {Object.entries(byAOI).map(([aoi, items]) => {
        const act = acts.find(a => a.codigoAOI === aoi);
        const porTipo = {};
        items.forEach(it => {
          if (!porTipo[it.tipo]) porTipo[it.tipo] = [];
          porTipo[it.tipo].push(it);
        });
        return (
          <div key={aoi}>
            <div className="text-sm font-semibold mb-2" style={{ color: '#1E2A3A' }}>
              Actividad Operativa: {aoi}
              {act && <span className="font-normal text-xs ml-2" style={{ color: '#7A6F5C' }}>— {act.nombre}</span>}
            </div>
            {Object.entries(porTipo).map(([tipo, lista]) => {
              const sum = lista.reduce((s, l) => s + (Number(l.importe) || 0), 0);
              return (
                <div key={tipo} className="mb-3">
                  <div className="text-xs font-semibold mb-1" style={{ color: '#9C7A2B' }}>{tipo}:</div>
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#1E2A3A' }}>
                        <th className="text-left px-2 py-1.5" style={{ color: '#F5F1E8' }}>Clasificador</th>
                        <th className="text-right px-2 py-1.5" style={{ color: '#F5F1E8' }}>Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map(l => (
                        <tr key={l.id} className="border-b" style={{ borderColor: '#E5DDD0' }}>
                          <td className="px-2 py-1.5" style={{ color: '#1E2A3A' }}>{l.clasificador}</td>
                          <td className="px-2 py-1.5 text-right" style={{ color: '#1E2A3A' }}>{fmtMoney(l.importe)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#F0E9D9' }}>
                        <td className="px-2 py-1.5 font-bold" style={{ color: '#1E2A3A' }}>Total</td>
                        <td className="px-2 py-1.5 text-right font-bold" style={{ color: '#1E2A3A' }}>{fmtMoney(sum)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   CONFIGURACIÓN DE PERIODOS DE REGISTRO
============================================================ */
function ConfigPeriodos({ periodos, savePeriodos }) {
  const [year, setYear] = useState(2026);
  const [editing, setEditing] = useState(null);

  function getRow(mes) {
    return periodos.find(p => p.anio === year && p.mes === mes) || {
      id: '', anio: year, mes, fechaApertura: '', horaApertura: '',
      fechaCierre: '', horaCierre: '', estadoForzado: 'auto'
    };
  }

  function openEdit(mes) {
    const existing = periodos.find(p => p.anio === year && p.mes === mes);
    setEditing(existing
      ? JSON.parse(JSON.stringify({ horaApertura: '00:00', horaCierre: '23:59', ...existing }))
      : {
          id: uid(), anio: year, mes,
          fechaApertura: '', horaApertura: '00:00',
          fechaCierre: '', horaCierre: '23:59',
          estadoForzado: 'auto'
        });
  }

  async function handleSave() {
    const exists = periodos.find(p => p.id === editing.id);
    const next = exists
      ? periodos.map(p => p.id === editing.id ? editing : p)
      : [...periodos, editing];
    await savePeriodos(next);
    setEditing(null);
  }

  async function aplicarPlantilla() {
    if (!confirm('Esto generará una configuración estándar: cada mes apertura el día 1 del mes siguiente a las 08:00 y cierra el día 15 a las 18:00. ¿Continuar?')) return;
    const next = [...periodos.filter(p => p.anio !== year)];
    for (let m = 1; m <= 12; m++) {
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? year + 1 : year;
      const mm = String(nextMonth).padStart(2, '0');
      next.push({
        id: uid(), anio: year, mes: m,
        fechaApertura: `${nextYear}-${mm}-01`, horaApertura: '08:00',
        fechaCierre: `${nextYear}-${mm}-15`, horaCierre: '18:00',
        estadoForzado: 'auto',
      });
    }
    await savePeriodos(next);
  }

  return (
    <>
      <PageHeader title="Periodos de registro" subtitle="Administración de fechas y horarios"
        action={
          <button onClick={aplicarPlantilla}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: '#C9A350', color: '#1E2A3A' }}>
            <CalendarClock size={16} /> Aplicar plantilla estándar
          </button>
        } />

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#7A6F5C' }}>Año:</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 px-3 py-1.5 rounded-md border text-sm" style={{ borderColor: '#E5DDD0' }}>
            {ANIOS_DISPONIBLES.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-xs ml-3" style={{ color: '#7A6F5C' }}>
            Fecha actual del sistema: <strong>{HOY} {HORA_ACTUAL}</strong>
          </span>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Mes</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Apertura</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Cierre</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Estado</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Detalle</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {MESES.map((m, i) => {
                const row = getRow(i + 1);
                const info = getEstadoPeriodo(periodos, year, i + 1);
                const badge =
                  info.estado === 'abierto' ? { bg: '#D8EBD3', color: '#2D7A4E', txt: 'Abierto', icon: Unlock } :
                  info.estado === 'cerrado' ? { bg: '#F5D5D5', color: '#B33B3B', txt: 'Cerrado', icon: Lock } :
                  info.estado === 'por_abrir' ? { bg: '#FBF1D9', color: '#9C7A2B', txt: 'Por abrir', icon: Clock } :
                  { bg: '#F0E9D9', color: '#7A6F5C', txt: 'Sin configurar', icon: AlertCircle };
                const Icon = badge.icon;
                return (
                  <tr key={i} className="border-b last:border-b-0" style={{ borderColor: '#E5DDD0' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1E2A3A' }}>{m}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: row.fechaApertura ? '#1E2A3A' : '#9C9080' }}>
                      {row.fechaApertura
                        ? <>{row.fechaApertura} <strong style={{ color: '#9C7A2B' }}>{row.horaApertura || '00:00'}</strong></>
                        : 'No configurado'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: row.fechaCierre ? '#1E2A3A' : '#9C9080' }}>
                      {row.fechaCierre
                        ? <>{row.fechaCierre} <strong style={{ color: '#9C7A2B' }}>{row.horaCierre || '23:59'}</strong></>
                        : 'No configurado'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold"
                        style={{ background: badge.bg, color: badge.color }}>
                        <Icon size={11} /> {badge.txt}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#7A6F5C' }}>{info.motivo}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(i + 1)}
                        className="p-1.5 rounded hover:bg-stone-200" title="Configurar">
                        <Edit3 size={14} style={{ color: '#1E2A3A' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
          <div className="rounded-lg max-w-xl w-full" style={{ background: '#FAF7F0' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5DDD0' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
                Configurar {MESES[editing.mes - 1]} {editing.anio}
              </div>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de apertura">
                  <input type="date" value={editing.fechaApertura}
                    onChange={(e) => setEditing({ ...editing, fechaApertura: e.target.value })}
                    className={inputCls} />
                </Field>
                <Field label="Hora de apertura">
                  <input type="time" value={editing.horaApertura || ''}
                    onChange={(e) => setEditing({ ...editing, horaApertura: e.target.value })}
                    className={inputCls} />
                </Field>
                <Field label="Fecha de cierre">
                  <input type="date" value={editing.fechaCierre}
                    onChange={(e) => setEditing({ ...editing, fechaCierre: e.target.value })}
                    className={inputCls} />
                </Field>
                <Field label="Hora de cierre">
                  <input type="time" value={editing.horaCierre || ''}
                    onChange={(e) => setEditing({ ...editing, horaCierre: e.target.value })}
                    className={inputCls} />
                </Field>
              </div>
              <Field label="Estado forzado (opcional)">
                <select value={editing.estadoForzado || 'auto'}
                  onChange={(e) => setEditing({ ...editing, estadoForzado: e.target.value })}
                  className={inputCls}>
                  <option value="auto">Automático (según fecha y hora)</option>
                  <option value="abierto">Forzar abierto</option>
                  <option value="cerrado">Forzar cerrado</option>
                </select>
              </Field>
              <div className="p-3 rounded-md text-xs" style={{ background: '#F0E9D9', color: '#7A6F5C' }}>
                El sistema verifica fecha + hora para determinar automáticamente el estado del periodo. Por ejemplo: si la apertura es el 1 de abril a las 08:00 y el cierre es el 15 de abril a las 18:00, el periodo estará disponible solo en ese rango exacto.
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: '#E5DDD0' }}>
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cancelar</button>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
                <Save size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   GESTIÓN DE SOLICITUDES
============================================================ */
function Solicitudes({ solicitudes, saveSolicitudes, reprogramaciones, saveReprogramaciones, periodos, savePeriodos, activities, usuarios, logAuditoria, notificar }) {
  const [tab, setTab] = useState('apertura'); // 'apertura' o 'reprogramacion'
  const [filtro, setFiltro] = useState('pendiente');
  const [verDetalle, setVerDetalle] = useState(null);
  const [verReprog, setVerReprog] = useState(null);

  const tiposLabel = {
    reapertura: 'Reapertura',
    ampliacion: 'Ampliación de plazo',
    apertura_anticipada: 'Apertura anticipada',
  };

  const filtradas = filtro === 'todas' ? solicitudes : solicitudes.filter(s => s.estado === filtro);
  const ordenadas = [...filtradas].sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));

  // Reprogramaciones
  const reprogFiltro = filtro === 'pendiente' ? 'solicitada' :
                        filtro === 'aprobada' ? 'aprobada' :
                        filtro === 'rechazada' ? 'rechazada' : 'todas';
  const reprogsFiltradas = reprogFiltro === 'todas' ? reprogramaciones :
                            reprogramaciones.filter(r => r.estado === reprogFiltro);
  const reprogsOrdenadas = [...reprogsFiltradas].sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));

  async function aprobar(sol) {
    const resp = prompt('Mensaje de respuesta (opcional):', 'Solicitud aprobada. Se ha actualizado el periodo correspondiente.');
    if (resp === null) return;
    const dias = sol.diasSolicitados || 5;
    const periodoExistente = periodos.find(p => p.anio === sol.anio && p.mes === sol.mes);
    let nuevosPeriodos;
    if (periodoExistente) {
      const newCierre = sumarDias(HOY, dias);
      nuevosPeriodos = periodos.map(p =>
        (p.anio === sol.anio && p.mes === sol.mes)
          ? { ...p, fechaCierre: newCierre, horaCierre: '23:59', estadoForzado: 'auto' }
          : p);
    } else {
      nuevosPeriodos = [...periodos, {
        id: uid(), anio: sol.anio, mes: sol.mes,
        fechaApertura: HOY, horaApertura: '00:00',
        fechaCierre: sumarDias(HOY, dias), horaCierre: '23:59',
        estadoForzado: 'auto',
      }];
    }
    await savePeriodos(nuevosPeriodos);
    const nuevasSol = solicitudes.map(s =>
      s.id === sol.id
        ? { ...s, estado: 'aprobada', respuestaAdmin: resp, fechaRespuesta: new Date().toISOString() }
        : s);
    await saveSolicitudes(nuevasSol);

    // Auditoría
    if (logAuditoria) {
      await logAuditoria('aprobar_solicitud',
        `Aprobó solicitud de ${sol.solicitante} para ${MESES[sol.mes-1]} ${sol.anio} (${sol.centroCosto})`,
        { solicitudId: sol.id, dias });
    }
    // Notificar al solicitante
    if (notificar) {
      const dest = usuariosDelCC(usuarios, sol.centroCosto);
      await notificar({
        destinatarios: dest,
        tipo: 'solicitud_aprobada',
        titulo: `Solicitud aprobada — ${MESES[sol.mes-1]} ${sol.anio}`,
        mensaje: `Tu solicitud de ${sol.tipo === 'reapertura' ? 'reapertura' : sol.tipo === 'ampliacion' ? 'ampliación' : 'apertura anticipada'} fue aprobada. ${resp}`,
        link: 'seguimiento',
      });
    }
    setVerDetalle(null);
  }

  async function rechazar(sol) {
    const resp = prompt('Motivo del rechazo:', '');
    if (resp === null || !resp.trim()) return;
    const nuevasSol = solicitudes.map(s =>
      s.id === sol.id
        ? { ...s, estado: 'rechazada', respuestaAdmin: resp, fechaRespuesta: new Date().toISOString() }
        : s);
    await saveSolicitudes(nuevasSol);

    if (logAuditoria) {
      await logAuditoria('rechazar_solicitud',
        `Rechazó solicitud de ${sol.solicitante} para ${MESES[sol.mes-1]} ${sol.anio}`,
        { solicitudId: sol.id, motivo: resp });
    }
    if (notificar) {
      const dest = usuariosDelCC(usuarios, sol.centroCosto);
      await notificar({
        destinatarios: dest,
        tipo: 'solicitud_rechazada',
        titulo: `Solicitud rechazada — ${MESES[sol.mes-1]} ${sol.anio}`,
        mensaje: `Tu solicitud fue rechazada. Motivo: ${resp}`,
        link: 'mis_solicitudes',
      });
    }
    setVerDetalle(null);
  }

  const counts = {
    pendiente: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobada: solicitudes.filter(s => s.estado === 'aprobada').length,
    rechazada: solicitudes.filter(s => s.estado === 'rechazada').length,
    todas: solicitudes.length,
  };

  const reprogCounts = {
    pendiente: reprogramaciones.filter(r => r.estado === 'solicitada').length,
    aprobada: reprogramaciones.filter(r => r.estado === 'aprobada').length,
    rechazada: reprogramaciones.filter(r => r.estado === 'rechazada').length,
    cerrada: reprogramaciones.filter(r => r.estado === 'cerrada').length,
    todas: reprogramaciones.length,
  };

  return (
    <>
      <PageHeader title="Solicitudes" subtitle="Apertura de periodos y reprogramaciones POI" />

      {/* Tabs principales */}
      <Card className="p-2 mb-4">
        <div className="flex gap-2">
          <button onClick={() => setTab('apertura')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold flex-1 justify-center"
            style={{
              background: tab === 'apertura' ? '#1E2A3A' : 'transparent',
              color: tab === 'apertura' ? '#F5F1E8' : '#1E2A3A',
            }}>
            <MailOpen size={16} /> Apertura / Ampliación de plazo
            {counts.pendiente > 0 && tab !== 'apertura' &&
              <span className="ml-1 px-1.5 rounded-full text-xs font-bold"
                style={{ background: '#C9A350', color: '#1E2A3A' }}>{counts.pendiente}</span>}
          </button>
          <button onClick={() => setTab('reprogramacion')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold flex-1 justify-center"
            style={{
              background: tab === 'reprogramacion' ? '#1E2A3A' : 'transparent',
              color: tab === 'reprogramacion' ? '#F5F1E8' : '#1E2A3A',
            }}>
            <RefreshCw size={16} /> Reprogramación POI
            {reprogCounts.pendiente > 0 && tab !== 'reprogramacion' &&
              <span className="ml-1 px-1.5 rounded-full text-xs font-bold"
                style={{ background: '#C9A350', color: '#1E2A3A' }}>{reprogCounts.pendiente}</span>}
          </button>
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} style={{ color: '#7A6F5C' }} />
          <span className="text-xs uppercase tracking-wider font-medium mr-2" style={{ color: '#7A6F5C' }}>Estado:</span>
          {[
            { id: 'pendiente', label: 'Pendientes', color: '#FBF1D9', activeColor: '#C9A350' },
            { id: 'aprobada', label: 'Aprobadas', color: '#D8EBD3', activeColor: '#2D7A4E' },
            { id: 'rechazada', label: 'Rechazadas', color: '#F5D5D5', activeColor: '#B33B3B' },
            { id: 'todas', label: 'Todas', color: '#F0E9D9', activeColor: '#1E2A3A' },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
              style={{
                background: filtro === f.id ? f.activeColor : f.color,
                color: filtro === f.id ? '#F5F1E8' : '#1E2A3A',
              }}>
              {f.label} ({tab === 'apertura' ? counts[f.id] : reprogCounts[f.id === 'pendiente' ? 'pendiente' : f.id] || 0})
            </button>
          ))}
        </div>
      </Card>

      {tab === 'apertura' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Fecha</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Tipo</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Periodo</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Solicitante</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>CC / AOI</th>
                  <th className="text-center px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: '#7A6F5C' }}>
                    No hay solicitudes en este filtro.
                  </td></tr>
                )}
                {ordenadas.map(s => {
                  const badge =
                    s.estado === 'pendiente' ? { bg: '#FBF1D9', color: '#9C7A2B', icon: Clock } :
                    s.estado === 'aprobada' ? { bg: '#D8EBD3', color: '#2D7A4E', icon: Check } :
                    { bg: '#F5D5D5', color: '#B33B3B', icon: XCircle };
                  const Icon = badge.icon;
                  return (
                    <tr key={s.id} className="border-b last:border-b-0 hover:bg-stone-50" style={{ borderColor: '#E5DDD0' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>{s.fechaSolicitud.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>{tiposLabel[s.tipo] || s.tipo}</td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: '#1E2A3A' }}>{MESES[s.mes-1]} {s.anio}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>
                        <div className="font-medium">{s.solicitante}</div>
                        <div style={{ color: '#7A6F5C' }}>{s.cargo}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <Pill>{s.centroCosto}</Pill>
                        <div className="font-mono mt-1" style={{ color: '#7A6F5C' }}>{s.codigoAOI}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold"
                          style={{ background: badge.bg, color: badge.color }}>
                          <Icon size={11} /> {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setVerDetalle(s)}
                          className="text-xs px-3 py-1.5 rounded-md font-medium"
                          style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'reprogramacion' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Fecha</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>CC</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Meses</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Solicitante</th>
                  <th className="text-center px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {reprogsOrdenadas.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#7A6F5C' }}>
                    No hay solicitudes de reprogramación en este filtro.
                  </td></tr>
                )}
                {reprogsOrdenadas.map(r => {
                  const stateBadge =
                    r.estado === 'solicitada' ? { bg: '#FBF1D9', color: '#9C7A2B', icon: Clock, txt: 'Solicitada' } :
                    r.estado === 'aprobada' ? { bg: '#D8EBD3', color: '#2D7A4E', icon: Check, txt: 'Aprobada' } :
                    r.estado === 'rechazada' ? { bg: '#F5D5D5', color: '#B33B3B', icon: XCircle, txt: 'Rechazada' } :
                    { bg: '#E0E5EC', color: '#5C6B7F', icon: Lock, txt: 'Cerrada' };
                  const Icon = stateBadge.icon;
                  return (
                    <tr key={r.id} className="border-b last:border-b-0 hover:bg-stone-50" style={{ borderColor: '#E5DDD0' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>{r.fechaSolicitud.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <Pill>{r.centroCosto}</Pill>
                        {r.area && <div className="mt-1"><Pill bg="#FBE0D0" color="#A85D2B">{r.area}</Pill></div>}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: '#1E2A3A' }}>
                        {(r.mesesAfectados || []).map(m => MESES[m-1].slice(0,3)).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>
                        <div className="font-medium">{r.solicitante}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold"
                          style={{ background: stateBadge.bg, color: stateBadge.color }}>
                          <Icon size={11} /> {stateBadge.txt}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setVerReprog(r)}
                          className="text-xs px-3 py-1.5 rounded-md font-medium"
                          style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {verDetalle && (
        <DetalleSolicitudModal
          solicitud={verDetalle}
          tiposLabel={tiposLabel}
          onClose={() => setVerDetalle(null)}
          onAprobar={() => aprobar(verDetalle)}
          onRechazar={() => rechazar(verDetalle)}
        />
      )}

      {verReprog && (
        <DetalleReprogModal
          reprog={verReprog}
          reprogramaciones={reprogramaciones}
          saveReprogramaciones={saveReprogramaciones}
          usuarios={usuarios}
          logAuditoria={logAuditoria}
          notificar={notificar}
          onClose={() => setVerReprog(null)}
        />
      )}
    </>
  );
}

function DetalleReprogModal({ reprog, reprogramaciones, saveReprogramaciones, onClose, usuarios, logAuditoria, notificar }) {
  const [fechaApertura, setFechaApertura] = useState(reprog.fechaApertura || HOY);
  const [horaApertura, setHoraApertura] = useState(reprog.horaApertura || '08:00');
  const [fechaCierre, setFechaCierre] = useState(reprog.fechaCierre || sumarDias(HOY, 7));
  const [horaCierre, setHoraCierre] = useState(reprog.horaCierre || '18:00');
  const [mensaje, setMensaje] = useState('');

  async function aprobar() {
    if (!fechaApertura || !fechaCierre) {
      alert('Define la ventana de apertura y cierre');
      return;
    }
    const msg = mensaje || 'Reprogramación aprobada. Tienes habilitada la ventana para modificar la programación.';
    const next = reprogramaciones.map(r => r.id === reprog.id ? {
      ...r,
      estado: 'aprobada',
      fechaApertura, horaApertura,
      fechaCierre, horaCierre,
      respuestaAdmin: msg,
      fechaRespuesta: new Date().toISOString(),
    } : r);
    await saveReprogramaciones(next);
    if (logAuditoria) {
      await logAuditoria('aprobar_reprog',
        `Aprobó reprogramación de ${reprog.solicitante} para ${reprog.centroCosto} (meses ${(reprog.mesesAfectados||[]).map(m => MESES[m-1]).join(', ')})`,
        { reprogId: reprog.id, ventana: `${fechaApertura} ${horaApertura} - ${fechaCierre} ${horaCierre}` });
    }
    if (notificar && usuarios) {
      const dest = usuariosDelCC(usuarios, reprog.centroCosto);
      await notificar({
        destinatarios: dest,
        tipo: 'reprog_aprobada',
        titulo: `Reprogramación aprobada — ${reprog.centroCosto}`,
        mensaje: `Tu solicitud de reprogramación fue aprobada. Ventana: ${fechaApertura} ${horaApertura} hasta ${fechaCierre} ${horaCierre}. ${msg}`,
        link: 'reprogramacion',
      });
    }
    onClose();
  }

  async function rechazar() {
    if (!mensaje.trim()) {
      alert('Indica el motivo del rechazo');
      return;
    }
    const next = reprogramaciones.map(r => r.id === reprog.id ? {
      ...r,
      estado: 'rechazada',
      respuestaAdmin: mensaje,
      fechaRespuesta: new Date().toISOString(),
    } : r);
    await saveReprogramaciones(next);
    if (logAuditoria) {
      await logAuditoria('rechazar_reprog',
        `Rechazó reprogramación de ${reprog.solicitante} para ${reprog.centroCosto}`,
        { reprogId: reprog.id, motivo: mensaje });
    }
    if (notificar && usuarios) {
      const dest = usuariosDelCC(usuarios, reprog.centroCosto);
      await notificar({
        destinatarios: dest,
        tipo: 'reprog_rechazada',
        titulo: `Reprogramación rechazada — ${reprog.centroCosto}`,
        mensaje: `Tu solicitud de reprogramación fue rechazada. Motivo: ${mensaje}`,
        link: 'reprogramacion',
      });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5DDD0' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
              Solicitud de reprogramación POI
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
              Enviada el {reprog.fechaSolicitud.slice(0, 10)} por {reprog.solicitante}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <DataRow label="Centro de costo" value={reprog.centroCosto} />
          {reprog.area && <DataRow label="Área" value={reprog.area} />}
          <DataRow label="Meses solicitados" value={(reprog.mesesAfectados || []).map(m => MESES[m-1]).join(', ')} />
          <DataRow label="Solicitante" value={reprog.solicitante} />
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Sustento técnico</div>
            <div className="p-3 rounded-md text-sm leading-relaxed" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', color: '#1E2A3A' }}>
              {reprog.sustento}
            </div>
          </div>

          {reprog.estado === 'solicitada' && (
            <>
              <div className="pt-3 border-t" style={{ borderColor: '#E5DDD0' }}>
                <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#9C7A2B' }}>
                  Definir ventana de modificación
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fecha apertura">
                    <input type="date" value={fechaApertura} onChange={(e) => setFechaApertura(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Hora apertura">
                    <input type="time" value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Fecha cierre">
                    <input type="date" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Hora cierre">
                    <input type="time" value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </div>
              <Field label="Mensaje de respuesta">
                <textarea rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className={inputCls}
                  placeholder="Mensaje opcional al aprobar, o motivo si vas a rechazar..." />
              </Field>
            </>
          )}

          {reprog.estado !== 'solicitada' && reprog.respuestaAdmin && (
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>
                Respuesta ({reprog.fechaRespuesta?.slice(0, 10)})
              </div>
              <div className="p-3 rounded-md text-sm leading-relaxed"
                style={{ background: reprog.estado === 'aprobada' ? '#D8EBD3' : '#F5D5D5', color: '#1E2A3A' }}>
                {reprog.respuestaAdmin}
              </div>
              {reprog.estado === 'aprobada' && (
                <div className="text-xs mt-2" style={{ color: '#7A6F5C' }}>
                  Ventana: <strong>{reprog.fechaApertura} {reprog.horaApertura}</strong> hasta <strong>{reprog.fechaCierre} {reprog.horaCierre}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: '#E5DDD0' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cerrar</button>
          {reprog.estado === 'solicitada' && (
            <>
              <button onClick={rechazar}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: '#B33B3B', color: '#FFFFFF' }}>
                <XCircle size={14} /> Rechazar
              </button>
              <button onClick={aprobar}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: '#2D7A4E', color: '#FFFFFF' }}>
                <Check size={14} /> Aprobar y abrir ventana
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetalleSolicitudModal({ solicitud: s, tiposLabel, onClose, onAprobar, onRechazar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5DDD0' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
              Detalle de solicitud
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
              Enviada el {s.fechaSolicitud.slice(0, 10)}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <DataRow label="Tipo de solicitud" value={tiposLabel[s.tipo] || s.tipo} />
          <DataRow label="Periodo solicitado" value={`${MESES[s.mes-1]} ${s.anio}`} />
          <DataRow label="Centro de costo" value={s.centroCosto} />
          <DataRow label="Área" value={s.area || '—'} />
          <DataRow label="Código AOI" value={s.codigoAOI || '—'} />
          <DataRow label="Solicitante" value={s.solicitante} />
          <DataRow label="Cargo" value={s.cargo || '—'} />
          {(s.tipo === 'ampliacion' || s.tipo === 'reapertura') && (
            <DataRow label="Días solicitados" value={s.diasSolicitados} />
          )}
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Motivo / justificación</div>
            <div className="p-3 rounded-md text-sm leading-relaxed" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', color: '#1E2A3A' }}>
              {s.motivo}
            </div>
          </div>

          {s.estado !== 'pendiente' && (
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>
                Respuesta del administrador ({s.fechaRespuesta?.slice(0, 10)})
              </div>
              <div className="p-3 rounded-md text-sm leading-relaxed"
                style={{ background: s.estado === 'aprobada' ? '#D8EBD3' : '#F5D5D5', color: '#1E2A3A' }}>
                {s.respuestaAdmin || '(Sin mensaje)'}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: '#E5DDD0' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cerrar</button>
          {s.estado === 'pendiente' && (
            <>
              <button onClick={onRechazar}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: '#B33B3B', color: '#FFFFFF' }}>
                <XCircle size={14} /> Rechazar
              </button>
              <button onClick={onAprobar}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: '#2D7A4E', color: '#FFFFFF' }}>
                <Check size={14} /> Aprobar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="text-xs uppercase tracking-wider w-44 flex-shrink-0" style={{ color: '#7A6F5C' }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: '#1E2A3A' }}>{value}</div>
    </div>
  );
}

function sumarDias(fecha, dias) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/* ============================================================
   MIS SOLICITUDES (vista del responsable)
============================================================ */
function ReprogramacionPOI({ activities, saveActivities, progress, reprogramaciones, saveReprogramaciones, periodos, currentUser, usuarios, logAuditoria, notificar }) {
  const ccDisponibles = ccsVisibles(currentUser);
  const esResp = esResponsableCC(currentUser);
  const ccUser = esResp ? currentUser.centroCosto : null;
  const areasUser = expandirAreasUsuario(currentUser);

  // Filtrar reprogramaciones según el usuario:
  // - Admin/Lector: todas
  // - Responsable sin área: las de su CC
  // - Responsable con área: solo las que afectan sus áreas (cuyo campo 'area' está en sus áreas, o las sin área asignada)
  const reprogsVisibles = !esResp
    ? reprogramaciones
    : reprogramaciones.filter(r => {
        if (r.centroCosto !== ccUser) return false;
        if (!areasUser) return true;
        // Si la reprog tiene área asignada, verificar que sea de mis áreas
        if (r.area && currentUser.areas) return currentUser.areas.includes(r.area);
        return true;
      });

  const [showSolicitud, setShowSolicitud] = useState(false);
  const [editingReprog, setEditingReprog] = useState(null);

  // Para cada reprogramación, calcular si está abierta o cerrada
  function getEstadoReprog(r) {
    if (r.estado === 'solicitada') return { e: 'solicitada', label: 'Solicitada', color: '#9C7A2B', bg: '#FBF1D9', icon: Clock };
    if (r.estado === 'rechazada') return { e: 'rechazada', label: 'Rechazada', color: '#B33B3B', bg: '#F5D5D5', icon: XCircle };
    if (r.estado === 'cerrada') return { e: 'cerrada', label: 'Cerrada', color: '#5C6B7F', bg: '#E0E5EC', icon: Lock };
    // aprobada → ver si está dentro del periodo
    const ini = ts(r.fechaApertura, r.horaApertura);
    const fin = ts(r.fechaCierre, r.horaCierre);
    if (ini && AHORA < ini) return { e: 'por_abrir', label: 'Por abrir', color: '#9C7A2B', bg: '#FBF1D9', icon: Clock };
    if (fin && AHORA > fin) return { e: 'vencida', label: 'Plazo vencido', color: '#B33B3B', bg: '#F5D5D5', icon: Lock };
    return { e: 'abierta', label: 'Abierta', color: '#2D7A4E', bg: '#D8EBD3', icon: Unlock };
  }

  // ¿Hay alguna reprogramación abierta para los meses pendientes del CC?
  function getMesesEditablesParaCC(cc) {
    const set = new Set();
    reprogramaciones
      .filter(r => r.centroCosto === cc && r.estado === 'aprobada')
      .forEach(r => {
        const info = getEstadoReprog(r);
        if (info.e === 'abierta') {
          (r.mesesAfectados || []).forEach(m => set.add(m));
        }
      });
    return set;
  }

  // Meses pendientes de seguimiento del CC, considerando las áreas del usuario
  function getMesesPendientes(cc) {
    // Si el usuario tiene áreas restringidas, considerar solo sus actividades
    let acts;
    if (esResp && areasUser) {
      acts = activities.filter(a => a.centroCosto === cc && areasUser.includes(a.area));
    } else {
      acts = activities.filter(a => a.centroCosto === cc);
    }
    const pendientes = [];
    for (let m = 1; m <= 12; m++) {
      const algunRegistro = acts.some(a =>
        progress.find(p => p.actividadId === a.id && p.anio === 2026 && p.mes === m)
      );
      if (!algunRegistro) pendientes.push(m);
    }
    return pendientes;
  }

  async function enviarSolicitud(datos) {
    // Si el usuario tiene áreas asignadas, etiquetar la reprogramación con su área principal
    const areaLogica = (currentUser.areas && currentUser.areas.length === 1) ? currentUser.areas[0] : (datos.area || '');
    const nueva = {
      id: uid(),
      centroCosto: datos.cc,
      area: areaLogica, // nueva propiedad para filtrado por área
      mesesAfectados: datos.meses,
      solicitante: currentUser.nombre,
      cargo: areaLogica ? `Responsable ${areaLogica}` : (currentUser.centroCosto ? `Responsable ${currentUser.centroCosto}` : ''),
      sustento: datos.sustento,
      fechaSolicitud: new Date().toISOString(),
      estado: 'solicitada',
      fechaApertura: '', horaApertura: '',
      fechaCierre: '', horaCierre: '',
      fechaRespuesta: null,
      respuestaAdmin: '',
      programacionOriginal: null,
      programacionNueva: null,
    };
    await saveReprogramaciones([...reprogramaciones, nueva]);

    if (logAuditoria) {
      await logAuditoria('enviar_reprog',
        `Solicitó reprogramación de meses ${datos.meses.map(m => MESES[m-1]).join(', ')}${areaLogica ? ' (área ' + areaLogica + ')' : ''}`,
        { reprogId: nueva.id, centroCosto: datos.cc, area: areaLogica });
    }
    if (notificar) {
      const dest = adminUsernames(usuarios);
      await notificar({
        destinatarios: dest,
        tipo: 'reprog_recibida',
        titulo: `Nueva solicitud de reprogramación — ${datos.cc}`,
        mensaje: `${currentUser.nombre} solicita reprogramar ${datos.meses.map(m => MESES[m-1]).join(', ')}.`,
        link: 'solicitudes',
      });
    }

    setShowSolicitud(false);
    alert('Solicitud de reprogramación enviada. El administrador la revisará.');
  }

  async function guardarReprog(reprog, actsActualizadas) {
    // Guardar snapshot original solo la primera vez (antes de cualquier modificación)
    const programacionOriginal = reprog.programacionOriginal || actsActualizadas
      .map(a => {
        const original = activities.find(x => x.id === a.id);
        return original ? {
          id: original.id,
          codigoAOI: original.codigoAOI,
          nombre: original.nombre,
          metaAnualFisica: original.metaAnualFisica,
          presupuestoAnual: original.presupuestoAnual,
          programacion: JSON.parse(JSON.stringify(original.programacion)),
        } : null;
      }).filter(Boolean);

    // Aplicar los cambios SOLO en los meses afectados, manteniendo el resto intacto
    // y recalculando los totales anuales (Física anual y Financiera anual)
    const mesesAfect = reprog.mesesAfectados || [];
    const next = activities.map(a => {
      const upd = actsActualizadas.find(x => x.id === a.id);
      if (!upd) return a;
      // Construir nueva programación: meses no afectados se mantienen del original, los afectados toman el valor nuevo
      const nuevaProg = a.programacion.map((mes, i) => {
        if (mesesAfect.includes(i + 1)) {
          return {
            fisica: Number(upd.programacion[i].fisica) || 0,
            financiera: Number(upd.programacion[i].financiera) || 0,
          };
        }
        return mes;
      });
      // Recalcular totales anuales sumando los 12 meses
      const nuevaMetaAnual = nuevaProg.reduce((s, m) => s + (Number(m.fisica) || 0), 0);
      const nuevoPresupAnual = nuevaProg.reduce((s, m) => s + (Number(m.financiera) || 0), 0);
      return {
        ...a,
        programacion: nuevaProg,
        metaAnualFisica: nuevaMetaAnual,
        presupuestoAnual: nuevoPresupAnual,
      };
    });
    await saveActivities(next);

    // Actualizar el registro de reprogramación
    const reprogActualizado = {
      ...reprog,
      programacionOriginal,
      programacionNueva: next
        .filter(a => a.centroCosto === reprog.centroCosto)
        .map(a => ({
          id: a.id, codigoAOI: a.codigoAOI, nombre: a.nombre,
          metaAnualFisica: a.metaAnualFisica,
          presupuestoAnual: a.presupuestoAnual,
          programacion: a.programacion,
        })),
      ultimaModificacion: new Date().toISOString(),
    };
    await saveReprogramaciones(reprogramaciones.map(r => r.id === reprog.id ? reprogActualizado : r));

    if (logAuditoria) {
      await logAuditoria('guardar_reprog',
        `Guardó cambios en reprogramación de ${reprog.centroCosto} (meses ${(reprog.mesesAfectados||[]).map(m => MESES[m-1]).join(', ')})`,
        { reprogId: reprog.id });
    }
    alert('Reprogramación guardada. La Programación POI se ha actualizado.');
  }

  async function cerrarReprog(reprog) {
    if (!confirm('¿Cerrar la reprogramación? Una vez cerrada no se podrá modificar.')) return;
    await saveReprogramaciones(reprogramaciones.map(r =>
      r.id === reprog.id
        ? { ...r, estado: 'cerrada', fechaCierreReal: new Date().toISOString() }
        : r
    ));
    if (logAuditoria) {
      await logAuditoria('cerrar_reprog',
        `Cerró la reprogramación de ${reprog.centroCosto}`,
        { reprogId: reprog.id });
    }
  }

  if (editingReprog) {
    return (
      <EditarReprog
        reprog={editingReprog}
        activities={activities}
        currentUser={currentUser}
        onSave={(acts) => guardarReprog(editingReprog, acts)}
        onClose={() => setEditingReprog(null)}
        onCerrar={() => { cerrarReprog(editingReprog); setEditingReprog(null); }}
      />
    );
  }

  return (
    <>
      <PageHeader title="Reprogramación POI" subtitle="Modificación de la programación física y financiera"
        action={esResp && (
          <button onClick={() => setShowSolicitud(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
            <Send size={16} /> Solicitar reprogramación
          </button>
        )} />

      {reprogsVisibles.length === 0 ? (
        <Card className="p-12 text-center">
          <RefreshCw size={32} className="mx-auto mb-3" style={{ color: '#9C7A2B' }} />
          <div className="text-sm" style={{ color: '#1E2A3A' }}>
            No hay reprogramaciones registradas.
          </div>
          {esResp && (
            <div className="text-xs mt-2" style={{ color: '#7A6F5C' }}>
              Pulsa "Solicitar reprogramación" para iniciar el proceso.
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {reprogsVisibles.map(r => {
            const info = getEstadoReprog(r);
            const Icon = info.icon;
            const puedeEditar = esResp && info.e === 'abierta' && r.centroCosto === ccUser;
            const puedeExportar = info.e === 'cerrada' || info.e === 'vencida';
            return (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Pill>{r.centroCosto}</Pill>
                      {r.area && (
                        <Pill bg="#FBE0D0" color="#A85D2B">Área: {r.area}</Pill>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold"
                        style={{ background: info.bg, color: info.color }}>
                        <Icon size={11} /> {info.label}
                      </span>
                    </div>
                    <div className="text-base font-semibold" style={{ color: '#1E2A3A' }}>
                      Meses a reprogramar: {(r.mesesAfectados || []).map(m => MESES[m-1]).join(', ')}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
                      Solicitado el {r.fechaSolicitud.slice(0,10)} por {r.solicitante}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {puedeEditar && (
                      <button onClick={() => setEditingReprog(r)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold"
                        style={{ background: '#C9A350', color: '#1E2A3A' }}>
                        <Edit3 size={14} /> Modificar programación
                      </button>
                    )}
                    {puedeExportar && (
                      <>
                        <button onClick={() => exportarReprogPDF(r, activities)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold"
                          style={{ background: '#B33B3B', color: '#FFFFFF' }}>
                          <Printer size={14} /> PDF
                        </button>
                        <button onClick={() => exportarReprogExcel(r, activities)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold"
                          style={{ background: '#2D7A4E', color: '#FFFFFF' }}>
                          <FileSpreadsheet size={14} /> Excel
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mb-3 pb-3 border-b" style={{ borderColor: '#E5DDD0' }}>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Sustento</div>
                  <div className="text-sm leading-relaxed" style={{ color: '#1E2A3A' }}>{r.sustento}</div>
                </div>
                {r.estado === 'aprobada' && (
                  <div className="text-xs" style={{ color: '#7A6F5C' }}>
                    Ventana de edición: <strong style={{ color: '#1E2A3A' }}>{r.fechaApertura} {r.horaApertura}</strong> hasta <strong style={{ color: '#1E2A3A' }}>{r.fechaCierre} {r.horaCierre}</strong>
                  </div>
                )}
                {r.respuestaAdmin && (
                  <div className="mt-2 p-3 rounded-md text-xs leading-relaxed"
                    style={{ background: r.estado === 'rechazada' ? '#F5D5D5' : '#D8EBD3', color: '#1E2A3A' }}>
                    <strong>Respuesta del admin:</strong> {r.respuestaAdmin}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showSolicitud && esResp && (
        <SolicitudReprogModal
          cc={ccUser}
          area={currentUser.areas && currentUser.areas.length === 1 ? currentUser.areas[0] : null}
          mesesPendientes={getMesesPendientes(ccUser)}
          onSubmit={enviarSolicitud}
          onClose={() => setShowSolicitud(false)}
        />
      )}
    </>
  );
}

function SolicitudReprogModal({ cc, mesesPendientes, area, onSubmit, onClose }) {
  const [mesesSel, setMesesSel] = useState([]);
  const [sustento, setSustento] = useState('');

  function toggleMes(m) {
    setMesesSel(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a,b)=>a-b));
  }

  function send() {
    if (mesesSel.length === 0) { alert('Selecciona al menos un mes a reprogramar'); return; }
    if (!sustento.trim()) { alert('El sustento es obligatorio'); return; }
    onSubmit({ cc, meses: mesesSel, sustento, area });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5DDD0' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
              Solicitud de reprogramación POI
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
              Centro de costo: <strong>{cc}</strong>
              {area && <> · Área: <strong style={{ color: '#9C7A2B' }}>{area}</strong></>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#7A6F5C' }}>
              Meses pendientes de seguimiento (selecciona los que deseas reprogramar)
            </label>
            {mesesPendientes.length === 0 ? (
              <div className="p-3 rounded-md text-xs" style={{ background: '#F5D5D5', color: '#B33B3B' }}>
                No hay meses pendientes de seguimiento. Solo se pueden reprogramar meses que aún no tienen registros.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mesesPendientes.map(m => {
                  const selected = mesesSel.includes(m);
                  return (
                    <button key={m} onClick={() => toggleMes(m)}
                      className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      style={{
                        background: selected ? '#1E2A3A' : '#F0E9D9',
                        color: selected ? '#F5F1E8' : '#1E2A3A',
                        border: selected ? '1px solid #1E2A3A' : '1px solid #E5DDD0',
                      }}>
                      {MESES[m-1]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Field label="Sustento técnico de la reprogramación" full>
            <textarea rows={6} value={sustento} onChange={(e) => setSustento(e.target.value)}
              className={inputCls}
              placeholder="Explica detalladamente las razones técnicas que justifican la modificación de la programación física y financiera de los meses seleccionados..." />
          </Field>
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: '#E5DDD0' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cancelar</button>
          <button onClick={send}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
            style={{ background: '#C9A350', color: '#1E2A3A' }}>
            <Send size={14} /> Enviar solicitud
          </button>
        </div>
      </div>
    </div>
  );
}

function EditarReprog({ reprog, activities, onSave, onClose, onCerrar, currentUser }) {
  // Clonar las actividades del CC, filtradas por área del usuario si aplica
  const areasUser = expandirAreasUsuario(currentUser);
  const actsCC = activities.filter(a => {
    if (a.centroCosto !== reprog.centroCosto) return false;
    // Si la reprog tiene área asignada, filtrar por las áreas físicas de esa área lógica
    if (reprog.area) {
      const areasFisicas = AREAS_AGRUPADAS[reprog.area] || [reprog.area];
      if (!areasFisicas.includes(a.area)) return false;
    }
    // Si el usuario es responsable con áreas, doble verificación
    if (esResponsableCC(currentUser) && areasUser && !areasUser.includes(a.area)) return false;
    return true;
  });
  const [actsEdit, setActsEdit] = useState(JSON.parse(JSON.stringify(actsCC)));

  function updateProg(actId, mesIdx, campo, value) {
    setActsEdit(prev => prev.map(a => {
      if (a.id !== actId) return a;
      const newProg = [...a.programacion];
      newProg[mesIdx] = { ...newProg[mesIdx], [campo]: Number(value) || 0 };
      return { ...a, programacion: newProg };
    }));
  }

  const mesesAfectados = reprog.mesesAfectados || [];

  return (
    <>
      <PageHeader
        title="Modificar programación"
        subtitle={`${reprog.centroCosto} · Meses: ${mesesAfectados.map(m => MESES[m-1]).join(', ')}`}
        action={
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
              style={{ background: '#F0E9D9', color: '#1E2A3A' }}>
              Volver
            </button>
            <button onClick={() => onSave(actsEdit)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
              style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
              <Save size={16} /> Guardar cambios
            </button>
            <button onClick={onCerrar}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
              style={{ background: '#B33B3B', color: '#FFFFFF' }}>
              <Lock size={16} /> Cerrar reprogramación
            </button>
          </div>
        } />

      <Card className="p-4 mb-4" style={{ background: '#FBF1D9', border: 'none' }}>
        <div className="flex items-center gap-3">
          <Unlock size={20} style={{ color: '#9C7A2B', flexShrink: 0 }} />
          <div className="text-sm" style={{ color: '#1E2A3A' }}>
            <strong>Ventana abierta hasta {reprog.fechaCierre} a las {reprog.horaCierre}</strong>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {actsEdit.map(a => (
          <Card key={a.id} className="p-5">
            <div className="mb-3">
              <div className="text-xs font-mono mb-1" style={{ color: '#9C7A2B' }}>{a.codigoAOI}</div>
              <div className="text-sm font-semibold" style={{ color: '#1E2A3A' }}>{a.nombre}</div>
              <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>{a.area} · U.M.: {a.unidadMedida}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: '#F0E9D9' }}>
                    <th className="text-left px-2 py-1.5 uppercase" style={{ color: '#7A6F5C' }}>Mes</th>
                    <th className="text-right px-2 py-1.5 uppercase" style={{ color: '#7A6F5C' }}>Física</th>
                    <th className="text-right px-2 py-1.5 uppercase" style={{ color: '#7A6F5C' }}>Financiera (S/)</th>
                    <th className="text-center px-2 py-1.5 uppercase" style={{ color: '#7A6F5C' }}>Editable</th>
                  </tr>
                </thead>
                <tbody>
                  {MESES.map((m, i) => {
                    const editable = mesesAfectados.includes(i + 1);
                    return (
                      <tr key={i} className="border-b" style={{ borderColor: '#E5DDD0', background: editable ? '#FFFFFF' : '#FAF7F0' }}>
                        <td className="px-2 py-1.5 font-medium" style={{ color: editable ? '#1E2A3A' : '#9C9080' }}>{m}</td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={a.programacion[i].fisica}
                            disabled={!editable}
                            onChange={(e) => updateProg(a.id, i, 'fisica', e.target.value)}
                            className="w-full text-right px-2 py-1 rounded border text-xs"
                            style={{
                              borderColor: '#E5DDD0',
                              background: editable ? '#FFFFFF' : '#F0E9D9',
                              color: editable ? '#1E2A3A' : '#9C9080'
                            }} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" step="0.01" value={a.programacion[i].financiera}
                            disabled={!editable}
                            onChange={(e) => updateProg(a.id, i, 'financiera', e.target.value)}
                            className="w-full text-right px-2 py-1 rounded border text-xs"
                            style={{
                              borderColor: '#E5DDD0',
                              background: editable ? '#FFFFFF' : '#F0E9D9',
                              color: editable ? '#1E2A3A' : '#9C9080'
                            }} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {editable
                            ? <Unlock size={12} style={{ color: '#2D7A4E', display: 'inline' }} />
                            : <Lock size={12} style={{ color: '#9C9080', display: 'inline' }} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// Exportar reprogramación a PDF (HTML imprimible)
function exportarReprogPDF(reprog, activities) {
  const actsCC = activities.filter(a => a.centroCosto === reprog.centroCosto);
  const mesesAfect = reprog.mesesAfectados || [];

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reprogramación POI - ${reprog.centroCosto}</title>
  <style>
    @page { size: A4 landscape; margin: 1.5cm; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #1E2A3A; }
    h1 { font-size: 16pt; text-align: center; color: #1E2A3A; margin-bottom: 4pt; }
    h2 { font-size: 12pt; color: #1E2A3A; border-bottom: 2px solid #C9A350; padding-bottom: 4pt; margin-top: 14pt; }
    .header { text-align: center; margin-bottom: 18pt; }
    .header .subtitle { color: #7A6F5C; font-size: 9pt; }
    table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 8pt; }
    th { background: #1E2A3A; color: #FFFFFF; padding: 4pt; text-align: center; }
    td { padding: 4pt; border: 1px solid #E5DDD0; }
    .info-box { background: #FAF7F0; padding: 8pt; border-left: 3px solid #C9A350; margin: 8pt 0; }
    p { margin: 4pt 0; }
    .mes-resaltado { background: #FBF1D9; font-weight: bold; }
    .num { text-align: right; }
    @media print { .no-print { display: none; } }
  </style></head><body>`;

  html += `<div class="header">
    <h1>Reporte de Reprogramación POI 2026</h1>
    <div class="subtitle">PROGRAMA NUESTRAS CIUDADES</div>
    <div class="subtitle">Centro de Costo: <strong>${reprog.centroCosto}</strong></div>
  </div>`;

  html += `<h2>I. Datos de la solicitud</h2>
  <div class="info-box">
    <p><strong>Solicitante:</strong> ${reprog.solicitante}</p>
    <p><strong>Fecha de solicitud:</strong> ${reprog.fechaSolicitud.slice(0,10)}</p>
    <p><strong>Meses reprogramados:</strong> ${mesesAfect.map(m => MESES[m-1]).join(', ')}</p>
    <p><strong>Sustento:</strong> ${reprog.sustento}</p>
    <p><strong>Ventana de modificación:</strong> ${reprog.fechaApertura} ${reprog.horaApertura} hasta ${reprog.fechaCierre} ${reprog.horaCierre}</p>
    ${reprog.respuestaAdmin ? `<p><strong>Aprobación:</strong> ${reprog.respuestaAdmin}</p>` : ''}
  </div>`;

  html += `<h2>II. Programación reprogramada por actividad operativa</h2>`;

  actsCC.forEach(a => {
    html += `<p><strong>${a.codigoAOI} — ${a.nombre}</strong><br/>
      <span style="color: #7A6F5C; font-size: 9pt">Área: ${a.area} · U.M.: ${a.unidadMedida}</span></p>`;
    html += `<table><thead><tr>
      <th>Concepto</th>${MESES.map(m => `<th>${m.slice(0,3)}</th>`).join('')}<th>Total</th>
    </tr></thead><tbody>`;
    const totalFis = a.programacion.reduce((s, p) => s + (Number(p.fisica)||0), 0);
    const totalFin = a.programacion.reduce((s, p) => s + (Number(p.financiera)||0), 0);
    html += `<tr><td>Física</td>${a.programacion.map((p, i) => `<td class="num${mesesAfect.includes(i+1) ? ' mes-resaltado' : ''}">${p.fisica}</td>`).join('')}<td class="num"><strong>${totalFis}</strong></td></tr>`;
    html += `<tr><td>Financiera (S/)</td>${a.programacion.map((p, i) => `<td class="num${mesesAfect.includes(i+1) ? ' mes-resaltado' : ''}">${Number(p.financiera).toFixed(2)}</td>`).join('')}<td class="num"><strong>${totalFin.toFixed(2)}</strong></td></tr>`;
    html += `</tbody></table>`;
  });

  html += `<div style="margin-top: 24pt; font-size: 8pt; color: #7A6F5C; text-align: center;">
    Documento generado el ${new Date().toLocaleString('es-PE')} desde el Sistema POI · Programa Nuestras Ciudades
  </div>`;

  html += `</body></html>`;

  // Abrir en nueva ventana para imprimir/guardar como PDF
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// Exportar a Excel (CSV con BOM compatible)
function exportarReprogExcel(reprog, activities) {
  const actsCC = activities.filter(a => a.centroCosto === reprog.centroCosto);
  const mesesAfect = reprog.mesesAfectados || [];
  const sep = '\t'; // tab para que Excel lo abra como columnas
  const rows = [];

  rows.push([`Reprogramación POI 2026 - ${reprog.centroCosto}`]);
  rows.push([]);
  rows.push(['Solicitante', reprog.solicitante]);
  rows.push(['Fecha de solicitud', reprog.fechaSolicitud.slice(0,10)]);
  rows.push(['Meses reprogramados', mesesAfect.map(m => MESES[m-1]).join(', ')]);
  rows.push(['Sustento', reprog.sustento]);
  rows.push(['Ventana', `${reprog.fechaApertura} ${reprog.horaApertura} - ${reprog.fechaCierre} ${reprog.horaCierre}`]);
  rows.push([]);
  rows.push(['Cód. AOI', 'Actividad', 'Área', 'U.M.', 'Concepto', ...MESES, 'Total Anual']);

  actsCC.forEach(a => {
    const totalFis = a.programacion.reduce((s, p) => s + (Number(p.fisica)||0), 0);
    const totalFin = a.programacion.reduce((s, p) => s + (Number(p.financiera)||0), 0);
    rows.push([a.codigoAOI, a.nombre, a.area, a.unidadMedida, 'Física',
      ...a.programacion.map(p => p.fisica), totalFis]);
    rows.push([a.codigoAOI, a.nombre, a.area, a.unidadMedida, 'Financiera (S/)',
      ...a.programacion.map(p => Number(p.financiera).toFixed(2)), totalFin.toFixed(2)]);
  });

  const tsv = rows.map(r => r.join(sep)).join('\n');
  const blob = new Blob(['\ufeff', tsv], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Reprogramacion_${reprog.centroCosto.replace(/\s+/g, '_')}_${reprog.fechaSolicitud.slice(0,10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ============================================================
   NOTIFICACIONES — Panel del usuario
============================================================ */
function Notificaciones({ notificaciones, saveNotificaciones, allNotificaciones, setView }) {
  const ordenadas = [...notificaciones].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  async function marcarLeida(notif) {
    const next = allNotificaciones.map(n => n.id === notif.id ? { ...n, leida: true } : n);
    await saveNotificaciones(next);
  }

  async function marcarTodasLeidas() {
    const ids = new Set(notificaciones.map(n => n.id));
    const next = allNotificaciones.map(n => ids.has(n.id) ? { ...n, leida: true } : n);
    await saveNotificaciones(next);
  }

  async function eliminarTodas() {
    if (!confirm('¿Eliminar todas tus notificaciones?')) return;
    const ids = new Set(notificaciones.map(n => n.id));
    const next = allNotificaciones.filter(n => !ids.has(n.id));
    await saveNotificaciones(next);
  }

  const noLeidas = ordenadas.filter(n => !n.leida).length;
  const tipoColor = {
    solicitud_aprobada: { bg: '#D8EBD3', color: '#2D7A4E', icon: CheckCircle2 },
    solicitud_rechazada: { bg: '#F5D5D5', color: '#B33B3B', icon: XCircle },
    solicitud_recibida: { bg: '#FBF1D9', color: '#9C7A2B', icon: MailOpen },
    reprog_aprobada: { bg: '#D8EBD3', color: '#2D7A4E', icon: RefreshCw },
    reprog_rechazada: { bg: '#F5D5D5', color: '#B33B3B', icon: XCircle },
    reprog_recibida: { bg: '#FBF1D9', color: '#9C7A2B', icon: RefreshCw },
    reprog_cerrada_auto: { bg: '#E0E5EC', color: '#5C6B7F', icon: Lock },
    info: { bg: '#F0E9D9', color: '#1E2A3A', icon: Bell },
  };

  return (
    <>
      <PageHeader title="Notificaciones" subtitle={`${noLeidas} sin leer`}
        action={ordenadas.length > 0 && (
          <div className="flex gap-2">
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors"
                style={{ background: '#F0E9D9', color: '#1E2A3A' }}>
                <Check size={14} /> Marcar todas leídas
              </button>
            )}
            <button onClick={eliminarTodas}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors"
              style={{ background: '#F5D5D5', color: '#B33B3B' }}>
              <Trash2 size={14} /> Eliminar todas
            </button>
          </div>
        )} />

      {ordenadas.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell size={32} className="mx-auto mb-3" style={{ color: '#9C7A2B' }} />
          <div className="text-sm" style={{ color: '#1E2A3A' }}>No tienes notificaciones</div>
          <div className="text-xs mt-2" style={{ color: '#7A6F5C' }}>
            Aquí aparecerán las novedades del sistema (solicitudes aprobadas, cambios de estado, etc.)
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {ordenadas.map(n => {
            const cfg = tipoColor[n.tipo] || tipoColor.info;
            const Icon = cfg.icon;
            return (
              <Card key={n.id} className={`p-4 ${!n.leida ? '' : 'opacity-70'}`}
                style={{ borderLeft: !n.leida ? `4px solid ${cfg.color}` : '1px solid #E5DDD0' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-sm font-semibold" style={{ color: '#1E2A3A' }}>
                        {n.titulo}
                        {!n.leida && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                        )}
                      </div>
                      <div className="text-xs flex-shrink-0" style={{ color: '#7A6F5C' }}>
                        {fmtRelativo(n.timestamp)}
                      </div>
                    </div>
                    <div className="text-sm mt-1 leading-relaxed" style={{ color: '#1E2A3A' }}>
                      {n.mensaje}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {n.link && (
                        <button onClick={() => { marcarLeida(n); setView(n.link); }}
                          className="text-xs font-semibold" style={{ color: cfg.color }}>
                          Ir al módulo →
                        </button>
                      )}
                      {!n.leida && (
                        <button onClick={() => marcarLeida(n)}
                          className="text-xs" style={{ color: '#7A6F5C' }}>
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ============================================================
   BITÁCORA DE AUDITORÍA — Solo admin
============================================================ */
function Auditoria({ eventos }) {
  const [filtroAccion, setFiltroAccion] = useState('todas');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Categorías de acciones
  const categorias = {
    crear_actividad: { label: 'Crear actividad', cat: 'programacion' },
    editar_actividad: { label: 'Editar actividad', cat: 'programacion' },
    eliminar_actividad: { label: 'Eliminar actividad', cat: 'programacion' },
    registrar_seguimiento: { label: 'Registrar seguimiento', cat: 'seguimiento' },
    actualizar_seguimiento: { label: 'Actualizar seguimiento', cat: 'seguimiento' },
    enviar_solicitud: { label: 'Enviar solicitud', cat: 'solicitudes' },
    aprobar_solicitud: { label: 'Aprobar solicitud', cat: 'solicitudes' },
    rechazar_solicitud: { label: 'Rechazar solicitud', cat: 'solicitudes' },
    enviar_reprog: { label: 'Solicitar reprogramación', cat: 'reprog' },
    aprobar_reprog: { label: 'Aprobar reprogramación', cat: 'reprog' },
    rechazar_reprog: { label: 'Rechazar reprogramación', cat: 'reprog' },
    guardar_reprog: { label: 'Modificar reprogramación', cat: 'reprog' },
    cerrar_reprog: { label: 'Cerrar reprogramación', cat: 'reprog' },
    configurar_periodo: { label: 'Configurar periodo', cat: 'periodos' },
    crear_usuario: { label: 'Crear usuario', cat: 'usuarios' },
    editar_usuario: { label: 'Editar usuario', cat: 'usuarios' },
    eliminar_usuario: { label: 'Eliminar usuario', cat: 'usuarios' },
    crear_modif: { label: 'Registrar modif. presupuestal', cat: 'modifs' },
    editar_modif: { label: 'Editar modif. presupuestal', cat: 'modifs' },
    eliminar_modif: { label: 'Eliminar modif. presupuestal', cat: 'modifs' },
    login: { label: 'Iniciar sesión', cat: 'sesion' },
  };

  const catColor = {
    programacion: { bg: '#E0E5EC', color: '#5C6B7F' },
    seguimiento: { bg: '#D8EBD3', color: '#2D7A4E' },
    solicitudes: { bg: '#FBF1D9', color: '#9C7A2B' },
    reprog: { bg: '#FBE0D0', color: '#A85D2B' },
    periodos: { bg: '#F0E0F0', color: '#7A4E7A' },
    usuarios: { bg: '#E0E5EC', color: '#5C6B7F' },
    modifs: { bg: '#F5D5D5', color: '#B33B3B' },
    sesion: { bg: '#F0E9D9', color: '#1E2A3A' },
  };

  // Listar usuarios únicos para el filtro
  const usuarios = [...new Set(eventos.map(e => e.usuario))];

  // Filtrar eventos
  const filtrados = eventos.filter(e => {
    if (filtroAccion !== 'todas' && e.accion !== filtroAccion) return false;
    if (filtroUsuario && e.usuario !== filtroUsuario) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!e.detalle.toLowerCase().includes(q) && !e.nombre.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function exportarCSV() {
    const sep = '\t';
    const rows = [['Fecha/Hora', 'Usuario', 'Nombre', 'Rol', 'Centro Costo', 'Acción', 'Detalle']];
    filtrados.forEach(e => {
      rows.push([
        fmtTimestamp(e.timestamp),
        e.usuario, e.nombre, e.rol, e.centroCosto || '',
        categorias[e.accion]?.label || e.accion,
        e.detalle,
      ]);
    });
    const tsv = rows.map(r => r.join(sep)).join('\n');
    const blob = new Blob(['\ufeff', tsv], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Auditoria_POI_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Bitácora de auditoría" subtitle={`${eventos.length} eventos registrados`}
        action={filtrados.length > 0 && (
          <button onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: '#2D7A4E', color: '#FFFFFF' }}>
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>
        )} />

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Tipo de acción">
            <select value={filtroAccion} onChange={(e) => setFiltroAccion(e.target.value)} className={inputCls}>
              <option value="todas">Todas las acciones</option>
              {Object.entries(categorias).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Usuario">
            <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className={inputCls}>
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Buscar en detalle">
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className={inputCls} placeholder="palabra clave..." />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5DDD0', background: '#F0E9D9' }}>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Fecha/Hora</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Usuario</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Acción</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-sm" style={{ color: '#7A6F5C' }}>
                  {eventos.length === 0
                    ? 'Aún no hay eventos registrados. La bitácora comenzará a llenarse a medida que los usuarios interactúen con el sistema.'
                    : 'Ningún evento coincide con los filtros aplicados.'}
                </td></tr>
              )}
              {filtrados.map(e => {
                const cat = categorias[e.accion];
                const colorCfg = cat ? catColor[cat.cat] : catColor.sesion;
                return (
                  <tr key={e.id} className="border-b last:border-b-0 hover:bg-stone-50" style={{ borderColor: '#E5DDD0' }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#1E2A3A' }}>
                      <div className="font-mono">{fmtTimestamp(e.timestamp)}</div>
                      <div style={{ color: '#7A6F5C' }}>{fmtRelativo(e.timestamp)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>
                      <div className="font-semibold">{e.nombre}</div>
                      <div className="font-mono" style={{ color: '#7A6F5C' }}>{e.usuario}</div>
                      {e.centroCosto && <Pill>{e.centroCosto}</Pill>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded font-semibold"
                        style={{ background: colorCfg.bg, color: colorCfg.color }}>
                        {cat?.label || e.accion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#1E2A3A' }}>
                      <div className="leading-snug">{e.detalle}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filtrados.length > 0 && (
        <div className="text-xs text-center mt-4" style={{ color: '#7A6F5C' }}>
          Mostrando {filtrados.length} de {eventos.length} eventos totales
        </div>
      )}
    </>
  );
}

/* ============================================================
   DATOS DEMO PNC 2026
============================================================ */
function seedDemo() {
  const ACTS_DATA = [
    ['GESTIÓN PNC', 'GESTION PNC', '20260010820008', 'AOI00108200041', 'CONDUCCIÓN Y GESTIÓN DEL PROGRAMA NUESTRAS CIUDADES', 'INFORME', 12, 2094363],
    ['UGEDEUS', 'UGEDEUS', '20260010820016', 'AOI00108200103', 'CAPACITACIÓN EN GESTIÓN URBANA PARA LA PLANIFICACIÓN DEL DESARROLLO URBANO SOSTENIBLE', 'MUNICIPIO', 24, 250000],
    ['UGEDEUS', 'UGEDEUS', '20260010820027', 'AOI00108200199', 'IMPLEMENTACIÓN Y MONITOREO DE SISTEMAS DE INFORMACIÓN GEOGRÁFICA PARA LA GESTIÓN URBANA TERRITORIAL', 'MUNICIPIO', 12, 180000],
    ['UGEDEUS', 'UGEDEUS', '20260010820029', 'AOI00108200204', 'ELABORACIÓN DE PLANES DE ACONDICIONAMIENTO TERRITORIAL, PLANES URBANOS Y ESTUDIOS VINCULADOS A LA GESTIÓN URBANA SOSTENIBLE DE LAS CIUDADES', 'DOCUMENTO', 8, 387160],
    ['UGERDES', 'EMERGENCIA-DESCOLMATACIÓN', '20260010820445', 'AOI00108202307', 'ATENCIÓN DE ACTIVIDADES DE EMERGENCIA', 'INTERVENCIÓN', 30, 1500000],
    ['UGERDES', 'EMERGENCIA-TRANSITABILIDAD', '20260010820451', 'AOI00108202316', 'ATENCIÓN DE TRANSITABILIDAD DE VÍAS', 'KILÓMETRO', 25, 800000],
    ['UGERDES', 'MAQUINARIAS PREVENCIÓN', '20260010820033', 'AOI00108200213', 'INTERVENCIÓN EN MANTENIMIENTO DE CAUCES, DRENAJES Y ESTRUCTURAS DE SEGURIDAD FÍSICA FRENTE A PELIGROS CON LAS UBOS', 'INTERVENCIÓN', 350, 17000000],
    ['UGERDES', 'UGERDES', '20260010820032', 'AOI00108200212', 'ELABORACIÓN DE ESTUDIOS PARA ESTABLECER EL RIESGO EN LAS CIUDADES', 'DOCUMENTO TÉCNICO', 6, 1200000],
    ['UGERDES', 'UGERDES', '20260010820034', 'AOI00108200214', 'REALIZACIÓN DE ASISTENCIA TÉCNICA Y ACOMPAÑAMIENTO EN GESTIÓN DEL RIESGO DE DESASTRES EN LAS CIUDADES', 'INFORME TÉCNICO', 60, 1644570],
    ['UNINDEUS', 'CENTRO DE CONVENCIONES', '20260010820035', 'AOI00108200215', 'REALIZACIÓN DEL MANTENIMIENTO DE INSTALACIONES Y EQUIPAMIENTO DEL CENTRO DE CONVENCIONES 27 DE ENERO', 'MANTENIMIENTO', 12, 0],
    ['UNINDEUS', 'PIP BELÉN', '20260010820134', 'AOI00108201258', 'GESTIÓN Y ADMINISTRACIÓN PROG-003-2015-SNIP - 2277384 - BELEN', 'INFORME', 12, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820131', 'AOI00108201684', 'GESTIÓN Y ADMINISTRACIÓN 2256322 OLMOS', 'INFORME', 12, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820133', 'AOI00108201259', 'GESTIÓN Y ADMINISTRACIÓN PROG-012-2014-SNIP - 2270290 - OLMOS', 'INFORME', 12, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820146', 'AOI00108201640', 'CONSTRUCCIÓN DEL SISTEMA DE AGUA POTABLE Y ALCANTARILLADO - 2256322 OLMOS', 'OBRA', 1, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820156', 'AOI00108201679', 'SUPERVISIÓN Y LIQUIDACIÓN DE LA OBRA - 2256322 OLMOS', 'INFORME', 1, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820179', 'AOI00108201778', 'CONSTRUCCIÓN DE VÍA LOCAL - PIP 2266697 OLMOS', 'OBRA', 1, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820180', 'AOI00108201776', 'SUPERVISIÓN Y LIQUIDACIÓN PIP 2266697 OLMOS', 'INFORME', 1, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820181', 'AOI00108201777', 'GESTIÓN Y ADMINISTRACIÓN PIP 2266697 OLMOS', 'INFORME', 12, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820198', 'AOI00108201852', 'EXPEDIENTE TÉCNICO 2256322 - OLMOS', 'DOCUMENTO', 1, 0],
    ['UNINDEUS', 'PIP OLMOS', '20260010820199', 'AOI00108201854', 'EXPEDIENTE TÉCNICO PIP 2266697 OLMOS', 'DOCUMENTO', 1, 0],
    ['UNINDEUS', 'PIP PLAZA LA HERMANDAD', '20260010820450', 'AOI00108202315', 'GESTIÓN Y ADMINISTRACIÓN 2414594', 'INFORME', 12, 0],
    ['UNINDEUS', 'PIP ZARUMILLA MALECON', '20260010820143', 'AOI00108201680', 'SUPERVISIÓN Y LIQUIDACIÓN DE OBRAS 2288094 ZARUMILLA', 'INFORME', 1, 0],
    ['UNINDEUS', 'PIP ZARUMILLA MALECON', '20260010820212', 'AOI00108202108', 'CONSTRUCCIÓN DE BOULEVARD - PIP 2288094', 'OBRA', 1, 0],
    ['UNINDEUS', 'PIP ZARUMILLA MALECON', '20260010820215', 'AOI00108202109', 'GESTIÓN Y ADMINISTRACIÓN - PIP 2288094', 'INFORME', 12, 0],
    ['UNINDEUS', 'PIP ZARUMILLA MALECON', '20260010820330', 'AOI00108202172', 'EXPEDIENTE TÉCNICO -PIP 2288094', 'DOCUMENTO', 1, 0],
    ['UNINDEUS', 'PRE INVERSIÓN', '20260010820329', 'AOI00108202171', 'ESTUDIOS DE PRE-INVERSIÓN', 'DOCUMENTO', 4, 0],
    ['UNINDEUS', 'UNINDEUS', '20260010820014', 'AOI00108200084', 'REALIZACIÓN DE ASISTENCIA TÉCNICA A LAS UNIDADES FORMULADORAS Y EVALUADORAS DE LOS GOBIERNOS LOCALES', 'PERSONA CAPACITADA', 80, 0],
    ['UNINDEUS', 'UNINDEUS', '20260010820015', 'AOI00108200085', 'PROMOCIÓN DE LAS INVERSIONES PÚBLICO PRIVADAS EN PROYECTOS IDENTIFICADOS EN INSTRUMENTOS PARA LA GESTIÓN URBANO TERRITORIAL', 'EVENTO', 6, 0],
  ];

  const activities = ACTS_DATA.map(([cc, area, reg, aoi, nombre, ud, meta, presup]) => {
    const fisMensual = Math.floor(meta / 12);
    const fisRest = meta % 12;
    const finMensual = presup / 12;
    return {
      id: uid(), centroCosto: cc, area, codigoRegistro: reg, codigoAOI: aoi, nombre,
      unidadMedida: ud, responsable: '', metaAnualFisica: meta, presupuestoAnual: presup,
      programacion: Array.from({ length: 12 }, (_, i) => ({
        fisica: fisMensual + (i < fisRest ? 1 : 0),
        financiera: Math.round(finMensual * 100) / 100,
      })),
    };
  });

  const byAOI = {};
  activities.forEach(a => { byAOI[a.codigoAOI] = a.id; });

  // Datos de seguimiento de enero-marzo 2026 (del informe)
  const progress = [
    { id: uid(), actividadId: byAOI['AOI00108200041'], anio: 2026, mes: 1, avanceFisico: 1, avanceFinanciero: 165000,
      logros: 'Se elaboró un (01) Informe Técnico consolidado de las actividades ejecutadas por el Programa Nuestras Ciudades.',
      limitaciones: 'No se registraron limitaciones durante el presente periodo.',
      medidas: 'Realización de coordinaciones internas en los procesos de contratación de bienes y servicios, así como el apoyo a las áreas técnicas, y proyectos de inversión en la elaboración de los Planes de Trabajo y evaluación de viabilidad financiera, que permita el cumplimiento de metas para el presente ejercicio.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200041'], anio: 2026, mes: 2, avanceFisico: 1, avanceFinanciero: 172000,
      logros: 'Se elaboró un (01) Informe Técnico consolidado de las actividades ejecutadas por el Programa Nuestras Ciudades.',
      limitaciones: 'No se registraron limitaciones durante el presente periodo.',
      medidas: 'Realización de coordinaciones internas en los procesos de contratación de bienes y servicios, así como el apoyo a las áreas técnicas.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200041'], anio: 2026, mes: 3, avanceFisico: 1, avanceFinanciero: 178000,
      logros: 'Se elaboró un (01) Informe Técnico consolidado de las actividades ejecutadas por el Programa Nuestras Ciudades.',
      limitaciones: 'No se registraron limitaciones durante el presente periodo.',
      medidas: 'Realización de coordinaciones internas en los procesos de contratación de bienes y servicios, así como el apoyo a las áreas técnicas, y proyectos de inversión en la elaboración de los Planes de Trabajo y evaluación de viabilidad financiera.', fechaRegistro: new Date().toISOString() },

    { id: uid(), actividadId: byAOI['AOI00108200103'], anio: 2026, mes: 1, avanceFisico: 0, avanceFinanciero: 0,
      logros: 'Durante el mes de enero no se tienen programadas actividades de asistencia o capacitación.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'No se ha identificado metas para este mes en el plan de trabajo.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200103'], anio: 2026, mes: 2, avanceFisico: 0, avanceFinanciero: 0,
      logros: 'Durante el mes de febrero no se tienen programadas actividades de asistencia o capacitación.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'No se ha identificado metas para este mes en el plan de trabajo.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200103'], anio: 2026, mes: 3, avanceFisico: 2, avanceFinanciero: 8500,
      logros: 'Se sostuvieron dos reuniones de asistencia técnica a la municipalidad de Ite en la provincia de Jorge Basadre, en el departamento de Tacna, respecto a la elaboración de su esquema de Acondicionamiento urbano.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'No se ha identificado metas para este mes en el plan de trabajo.', fechaRegistro: new Date().toISOString() },

    { id: uid(), actividadId: byAOI['AOI00108200199'], anio: 2026, mes: 1, avanceFisico: 0, avanceFinanciero: 0,
      logros: 'Durante el mes de enero no se tienen programadas actividades en implementación de sistemas de información geográfica.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'Se han cursado invitaciones a gobiernos locales para la preinscripción en los programas de capacitación.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200199'], anio: 2026, mes: 2, avanceFisico: 0, avanceFinanciero: 0,
      logros: 'Se ha cursado la convocatoria a los gobiernos locales para su participación en los cursos de capacitación programados.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'Se han cursado invitaciones a gobiernos locales para la preinscripción en los programas de capacitación.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200199'], anio: 2026, mes: 3, avanceFisico: 2, avanceFinanciero: 15000,
      logros: 'Se tienen los grupos formados para el inicio de cursos en abril, se han realizado 2 vuelos fotogramétricos a las ciudades de Sauce y San José de Sisa.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'Se han cursado invitaciones a gobiernos locales para la preinscripción en los programas de capacitación.', fechaRegistro: new Date().toISOString() },

    { id: uid(), actividadId: byAOI['AOI00108200204'], anio: 2026, mes: 1, avanceFisico: 0, avanceFinanciero: 32000,
      logros: 'Se viene tramitando la contratación de los especialistas del equipo técnico para la culminación de los estudios de La Mar y Villa Perené.',
      limitaciones: 'Retrasos en la contratación de especialistas del equipo técnico de UGEDEUS.',
      medidas: 'Se ha remitido Oficio Múltiple de convocatoria destinado a iniciar el proceso de identificación y focalización.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200204'], anio: 2026, mes: 2, avanceFisico: 0, avanceFinanciero: 42000,
      logros: 'Se dio la contratación en la quincena de los especialistas del equipo técnico para la culminación de los estudios de La Mar y Villa Perené en un avance del 92%.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'No se adoptaron medidas adicionales durante el presente periodo.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200204'], anio: 2026, mes: 3, avanceFisico: 0, avanceFinanciero: 48000,
      logros: 'Se tiene un avance del 96% para la culminación de los estudios de La Mar y Villa Perené; asimismo se realizaron los talleres de inicio de los planes de desarrollo urbano de las ciudades de San José de Sisa y Sauce, en el departamento de San Martín.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'No se adoptaron medidas adicionales durante el presente periodo.', fechaRegistro: new Date().toISOString() },

    { id: uid(), actividadId: byAOI['AOI00108200212'], anio: 2026, mes: 1, avanceFisico: 0, avanceFinanciero: 0,
      logros: 'No se ejecutó ningún estudio. Aunque se realizaron coordinaciones con entidades técnico-científicas para la ejecución de los estudios y Gobiernos locales ubicados en el ámbito de los estudios.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'Se vienen realizando coordinaciones con instituciones técnico-científicas, a las cuales se les ha remitido oficio solicitando la expresión de interés y la presentación de su propuesta técnico-económica.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200212'], anio: 2026, mes: 2, avanceFisico: 0, avanceFinanciero: 25000,
      logros: 'Se elaboró con el IGP la propuesta de convenio específico de Colaboración Interinstitucional para la elaboración de 2 estudios de Zonificación Geofísica. Trabajos de campo en Cajamarca para 2 estudios de Evaluación del Riesgo de Desastres.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'En proceso de ejecución de estudios de evaluación de riesgos.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200212'], anio: 2026, mes: 3, avanceFisico: 1, avanceFinanciero: 95000,
      logros: 'Se suscribió el Convenio Específico N° 011-2026-VIVIENDA con el Instituto Geofísico del Perú (IGP), para la ejecución de 2 estudios de Zonificación Geofísica en Canta y Antioquia. Se ejecutó el estudio de Evaluación del Riesgo de Desastres por flujo de detritos en la quebrada Samana Cruz, distrito de Cajamarca.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'Se elaboró la propuesta de convenio específico final entre IGP y MVCS, la cual fue revisada por el área legal del PNC, para su posterior remisión al Viceministerio de Vivienda y Urbanismo.', fechaRegistro: new Date().toISOString() },

    { id: uid(), actividadId: byAOI['AOI00108200214'], anio: 2026, mes: 1, avanceFisico: 4, avanceFinanciero: 95000,
      logros: 'Informe Técnico 003: Identificación de tramos en ámbitos urbanos para intervención de PNC maquinarias. Informe Técnico 008: Evaluación de seguridad física de 234 predios en Lima para BFH.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'Se viene realizando la programación de las actividades de asistencia técnica y capacitación.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200214'], anio: 2026, mes: 2, avanceFisico: 3, avanceFinanciero: 88000,
      logros: 'Informe Técnico 010: Sustento técnico para intervenciones preventivas en el río Lurín. Informe Técnico 015: Opinión técnica para PIP I.E. José Abelardo Quiñones (Lambayeque). Informe 016: Evaluación de 3732 predios para BFH.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'Se viene realizando las coordinaciones para la ejecución de las actividades de capacitación.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200214'], anio: 2026, mes: 3, avanceFisico: 4, avanceFinanciero: 105000,
      logros: 'Informes 025, 030, 031 y 032: evaluación de seguridad física de predios y fajas marginales para intervención BFH y revisión de 31 viviendas en zona de riesgo no mitigable.',
      limitaciones: 'No se presentaron limitaciones.',
      medidas: 'Las asistencias técnicas se desarrollan también de manera virtual, a fin de facilitar la participación de un mayor número de funcionarios.', fechaRegistro: new Date().toISOString() },

    { id: uid(), actividadId: byAOI['AOI00108200213'], anio: 2026, mes: 1, avanceFisico: 13, avanceFinanciero: 580000,
      logros: 'Trece (13) intervenciones ejecutadas en las UBOs de Ancash (2), Arequipa (2), Ayacucho (2), Cajamarca (1), Huánuco (1), La Libertad (1), Lambayeque (1), Lima (2), Puno (1).',
      limitaciones: 'Reprogramación de intervenciones debido a maquinarias y vehículos inoperativos por su uso. Demora en la contratación de operadores de maquinaria pesada y vehículos.',
      medidas: 'Se implementaron acciones orientadas a reducir los tiempos en los procesos de contratación de bienes y servicios.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200213'], anio: 2026, mes: 2, avanceFisico: 43, avanceFinanciero: 1850000,
      logros: 'Cuarenta y tres (43) intervenciones ejecutadas en las UBOs de Ancash (6), Apurímac (1), Ayacucho (3), Cajamarca (2), Junín (3), La Libertad (3), Lambayeque (4), Lima (9), Piura (3), Puno (2), Tacna (4) y Tumbes (3).',
      limitaciones: 'Los DS 003 y 005 ocasionaron que se prioricen las intervenciones por emergencia antes que las de prevención, las cuales fueron reprogramadas.',
      medidas: 'Coordinaciones permanentes con los Coordinadores zonales de las UBOs para la programación de mayores Fichas Técnicas. Contratación de personal con duración mínima de 60 días, otorgando continuidad del servicio.', fechaRegistro: new Date().toISOString() },
    { id: uid(), actividadId: byAOI['AOI00108200213'], anio: 2026, mes: 3, avanceFisico: 65, avanceFinanciero: 2780000,
      logros: 'Sesenta y cinco (65) intervenciones ejecutadas en las UBOs de Ancash (5), Apurímac (4), Arequipa (1), Ayacucho (4), Cajamarca (4), Cusco (1), Huánuco (5), Ica (1), Junín (4), La Libertad (4), Lambayeque (1), Lima (14), Piura (5), Puno (3), Tacna (1) y Tumbes (8).',
      limitaciones: 'La variación del precio de combustible limita la disponibilidad para la ejecución continua de intervenciones.',
      medidas: 'Se gestionaron aportes con los gobiernos locales para contribuir al financiamiento de la adquisición de combustible.', fechaRegistro: new Date().toISOString() },

    { id: uid(), actividadId: byAOI['AOI00108202307'], anio: 2026, mes: 3, avanceFisico: 4, avanceFinanciero: 65000,
      logros: 'Cuatro (04) intervenciones de emergencia equivalentes a 10.27 Km ejecutados en las UBOs de Arequipa (4.65 km en 2 intervenciones), Junín (0.74 km), Tacna (0.15 km), Ayacucho (0.28 km), Puno (4.00 km) y Lambayeque (0.45 km).',
      limitaciones: 'La variación del precio de combustible limita la disponibilidad para la ejecución continua de intervenciones.',
      medidas: 'Las inspecciones realizadas por el Coordinador Regional UBO a la zona de intervención sean inmediatas, formulando el acta de inspección lo más pronto posible.', fechaRegistro: new Date().toISOString() },

    { id: uid(), actividadId: byAOI['AOI00108202316'], anio: 2026, mes: 3, avanceFisico: 2.75, avanceFinanciero: 48000,
      logros: 'En el mes de marzo se realizó la ejecución de 2.75 km en el distrito de Cayma, Provincia de Arequipa, en el marco de la Declaratoria de Emergencia con D.S 019-2026-PCM.',
      limitaciones: 'La variación del precio de combustible limita la disponibilidad para la ejecución continua de intervenciones.',
      medidas: 'Las inspecciones realizadas por el Coordinador Regional UBO para las intervenciones de transitabilidad sean inmediatas.', fechaRegistro: new Date().toISOString() },
  ];

  const modifs = [
    { id: uid(), fecha: '2026-01-31', anio: 2026, mes: 1, centroCosto: 'UGEDEUS', codigoAOI: 'AOI00108200204', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.1.1.13.1.2 CAS - Transitorio', importe: 50785, concepto: 'Financiar pago de remuneraciones del personal CAS', documento: '' },
    { id: uid(), fecha: '2026-01-31', anio: 2026, mes: 1, centroCosto: 'UGEDEUS', codigoAOI: 'AOI00108200204', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.1.1.9.1.4 Aguinaldos CAS', importe: 600, concepto: 'Financiar pago de aguinaldos CAS', documento: '' },
    { id: uid(), fecha: '2026-01-31', anio: 2026, mes: 1, centroCosto: 'UGEDEUS', codigoAOI: 'AOI00108200204', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.1.3.1.1.15 ESSALUD CAS', importe: 1336, concepto: 'Financiar contribuciones ESSALUD del personal CAS', documento: '' },
    { id: uid(), fecha: '2026-02-28', anio: 2026, mes: 2, centroCosto: 'UGEDEUS', codigoAOI: 'AOI00108200204', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.1.1.13.1.2 CAS', importe: 209687, concepto: 'Financiar pago de remuneraciones del personal CAS', documento: '' },
    { id: uid(), fecha: '2026-02-28', anio: 2026, mes: 2, centroCosto: 'UGERDES', codigoAOI: 'AOI00108202307', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.1.3.1.1 Combustibles y Carburantes', importe: 29490, concepto: 'Atención de actividades de emergencia en Arequipa', documento: '' },
    { id: uid(), fecha: '2026-02-28', anio: 2026, mes: 2, centroCosto: 'UGERDES', codigoAOI: 'AOI00108202307', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.2.4.5.1 De Vehículos', importe: 3000, concepto: 'Atención de actividades de emergencia en Arequipa', documento: '' },
    { id: uid(), fecha: '2026-02-28', anio: 2026, mes: 2, centroCosto: 'UGERDES', codigoAOI: 'AOI00108202307', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.2.4.7.1 De Maquinarias y Equipos', importe: 12000, concepto: 'Atención de actividades de emergencia en Arequipa', documento: '' },
    { id: uid(), fecha: '2026-02-28', anio: 2026, mes: 2, centroCosto: 'UGERDES', codigoAOI: 'AOI00108202307', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.2.7.14.98 Otros Servicios Técnicos', importe: 20698, concepto: 'Atención de actividades de emergencia en Arequipa', documento: '' },
    { id: uid(), fecha: '2026-03-31', anio: 2026, mes: 3, centroCosto: 'UGERDES', codigoAOI: 'AOI00108200213', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.1.3.1.1 Combustibles y Carburantes', importe: 127788, concepto: 'Atender intervenciones de limpieza y descolmatación', documento: '' },
    { id: uid(), fecha: '2026-03-31', anio: 2026, mes: 3, centroCosto: 'UGERDES', codigoAOI: 'AOI00108200213', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.1.3.1.3 Lubricantes, Grasas y Afines', importe: 2000, concepto: 'Atender intervenciones de limpieza y descolmatación', documento: '' },
    { id: uid(), fecha: '2026-03-31', anio: 2026, mes: 3, centroCosto: 'UGERDES', codigoAOI: 'AOI00108200213', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.1.6.1.1 De Vehículos', importe: 27200, concepto: 'Atender intervenciones de limpieza y descolmatación', documento: '' },
    { id: uid(), fecha: '2026-03-31', anio: 2026, mes: 3, centroCosto: 'UGERDES', codigoAOI: 'AOI00108200213', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.1.11.1.2 Para Vehículos', importe: 75740, concepto: 'Atender intervenciones de limpieza y descolmatación', documento: '' },
    { id: uid(), fecha: '2026-03-31', anio: 2026, mes: 3, centroCosto: 'UGERDES', codigoAOI: 'AOI00108200213', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.1.11.1.4 Para Maquinarias y Equipos', importe: 5000, concepto: 'Atender intervenciones de limpieza y descolmatación', documento: '' },
    { id: uid(), fecha: '2026-03-31', anio: 2026, mes: 3, centroCosto: 'UGERDES', codigoAOI: 'AOI00108200213', tipo: 'Tipo III - Créditos y Anulaciones', clasificador: '2.3.2.7.11.2 Transporte y Traslado de Carga', importe: 37000, concepto: 'Atender intervenciones de limpieza y descolmatación', documento: '' },
  ];

  const periodos = buildSeedPeriodos();
  const solicitudes = buildSeedSolicitudes();

  return { activities, progress, modifs, periodos, solicitudes };
}

function buildSeedPeriodos() {
  // Plantilla estándar para 2026: cada mes apertura día 1 del mes siguiente a las 08:00 y cierra día 15 a las 18:00
  const periodos = [];
  for (let m = 1; m <= 12; m++) {
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? 2027 : 2026;
    const mm = String(nextMonth).padStart(2, '0');
    periodos.push({
      id: Math.random().toString(36).slice(2, 10),
      anio: 2026, mes: m,
      fechaApertura: `${nextYear}-${mm}-01`, horaApertura: '08:00',
      fechaCierre: `${nextYear}-${mm}-15`, horaCierre: '18:00',
      estadoForzado: 'auto',
    });
  }
  return periodos;
}

function buildSeedSolicitudes() {
  return [
    {
      id: Math.random().toString(36).slice(2, 10),
      tipo: 'ampliacion',
      anio: 2026, mes: 3,
      centroCosto: 'UGERDES',
      area: 'MAQUINARIAS PREVENCIÓN',
      actividadId: '',
      codigoAOI: 'AOI00108200213',
      solicitante: 'Carlos Mendoza',
      cargo: 'Coordinador UGERDES',
      motivo: 'Se requiere ampliar el plazo de registro del mes de marzo por 5 días adicionales debido a que la consolidación de las 65 intervenciones ejecutadas en las UBOs a nivel nacional aún se encuentra en proceso de validación con los coordinadores regionales.',
      diasSolicitados: 5,
      fechaSolicitud: '2026-04-16T10:30:00.000Z',
      estado: 'pendiente',
      fechaRespuesta: null,
      respuestaAdmin: '',
    },
    {
      id: Math.random().toString(36).slice(2, 10),
      tipo: 'reapertura',
      anio: 2026, mes: 2,
      centroCosto: 'UGEDEUS',
      area: 'UGEDEUS',
      actividadId: '',
      codigoAOI: 'AOI00108200204',
      solicitante: 'María Quispe',
      cargo: 'Especialista UGEDEUS',
      motivo: 'Solicito la reapertura del mes de febrero para corregir el monto de avance financiero registrado, ya que el SIAF reflejó un ajuste posterior al cierre.',
      diasSolicitados: 3,
      fechaSolicitud: '2026-04-10T09:15:00.000Z',
      estado: 'aprobada',
      fechaRespuesta: '2026-04-10T15:00:00.000Z',
      respuestaAdmin: 'Solicitud aprobada. Se otorgan 3 días adicionales para realizar la corrección del registro.',
    },
  ];
}

/* ============================================================
   MIS SOLICITUDES — Vista del responsable
============================================================ */
function MisSolicitudes({ solicitudes }) {
  const ordenadas = [...solicitudes].sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));

  const tiposLabel = {
    reapertura: 'Reapertura',
    ampliacion: 'Ampliación de plazo',
    apertura_anticipada: 'Apertura anticipada',
  };

  const counts = {
    pendiente: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobada: solicitudes.filter(s => s.estado === 'aprobada').length,
    rechazada: solicitudes.filter(s => s.estado === 'rechazada').length,
  };

  return (
    <>
      <PageHeader title="Mis solicitudes" subtitle="Historial de solicitudes enviadas" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4" style={{ borderLeft: '4px solid #C9A350' }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Pendientes</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, color: '#9C7A2B' }}>
            {counts.pendiente}
          </div>
        </Card>
        <Card className="p-4" style={{ borderLeft: '4px solid #2D7A4E' }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Aprobadas</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, color: '#2D7A4E' }}>
            {counts.aprobada}
          </div>
        </Card>
        <Card className="p-4" style={{ borderLeft: '4px solid #B33B3B' }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Rechazadas</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, color: '#B33B3B' }}>
            {counts.rechazada}
          </div>
        </Card>
      </div>

      {ordenadas.length === 0 ? (
        <Card className="p-12 text-center">
          <MailOpen size={32} className="mx-auto mb-3" style={{ color: '#9C7A2B' }} />
          <div className="text-sm" style={{ color: '#1E2A3A' }}>
            No has enviado solicitudes aún.
          </div>
          <div className="text-xs mt-2" style={{ color: '#7A6F5C' }}>
            Cuando un periodo esté cerrado y necesites registrar avances, podrás solicitar apertura desde Seguimiento mensual.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordenadas.map(s => {
            const badge =
              s.estado === 'pendiente' ? { bg: '#FBF1D9', color: '#9C7A2B', icon: Clock, label: 'Pendiente' } :
              s.estado === 'aprobada' ? { bg: '#D8EBD3', color: '#2D7A4E', icon: Check, label: 'Aprobada' } :
              { bg: '#F5D5D5', color: '#B33B3B', icon: XCircle, label: 'Rechazada' };
            const Icon = badge.icon;
            return (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#9C7A2B' }}>
                      {tiposLabel[s.tipo] || s.tipo}
                    </div>
                    <div className="text-base font-semibold" style={{ color: '#1E2A3A' }}>
                      Periodo: {MESES[s.mes - 1]} {s.anio}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#7A6F5C' }}>
                      Enviada el {s.fechaSolicitud.slice(0, 10)} · {s.area} · {s.codigoAOI}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold"
                    style={{ background: badge.bg, color: badge.color }}>
                    <Icon size={11} /> {badge.label}
                  </span>
                </div>
                <div className="mb-3 pb-3 border-b" style={{ borderColor: '#E5DDD0' }}>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>Motivo</div>
                  <div className="text-sm leading-relaxed" style={{ color: '#1E2A3A' }}>{s.motivo}</div>
                  {(s.tipo === 'ampliacion' || s.tipo === 'reapertura') && (
                    <div className="text-xs mt-2" style={{ color: '#7A6F5C' }}>
                      Días solicitados: <strong>{s.diasSolicitados}</strong>
                    </div>
                  )}
                </div>
                {s.estado !== 'pendiente' && (
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7A6F5C' }}>
                      Respuesta del administrador ({s.fechaRespuesta?.slice(0, 10)})
                    </div>
                    <div className="text-sm p-3 rounded-md leading-relaxed"
                      style={{ background: s.estado === 'aprobada' ? '#D8EBD3' : '#F5D5D5', color: '#1E2A3A' }}>
                      {s.respuestaAdmin || '(Sin mensaje)'}
                    </div>
                  </div>
                )}
                {s.estado === 'pendiente' && (
                  <div className="text-xs italic flex items-center gap-2" style={{ color: '#9C7A2B' }}>
                    <Clock size={12} /> Tu solicitud está en revisión por el administrador.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ============================================================
   GESTIÓN DE USUARIOS — Solo administrador
============================================================ */
function GestionUsuarios({ usuarios, saveUsuarios }) {
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);

  function newUser() {
    setIsNew(true);
    setEditing({
      id: uid(),
      usuario: '',
      password: '',
      nombre: '',
      rol: 'responsable_cc',
      centroCosto: CENTROS_COSTO[0].nombre,
    });
  }

  function editUser(u) {
    setEditing(JSON.parse(JSON.stringify(u)));
    setIsNew(false);
  }

  async function handleSave() {
    if (!editing.usuario || !editing.password || !editing.nombre) {
      alert('Usuario, contraseña y nombre son obligatorios');
      return;
    }
    // Validar usuario único
    const otro = usuarios.find(u => u.usuario === editing.usuario && u.id !== editing.id);
    if (otro) {
      alert('El nombre de usuario ya está en uso');
      return;
    }
    if (editing.rol !== 'responsable_cc') {
      editing.centroCosto = null;
    }
    const exists = usuarios.find(u => u.id === editing.id);
    const next = exists ? usuarios.map(u => u.id === editing.id ? editing : u) : [...usuarios, editing];
    await saveUsuarios(next);
    setEditing(null);
  }

  async function handleDelete(id) {
    const u = usuarios.find(x => x.id === id);
    if (u?.rol === 'admin' && usuarios.filter(x => x.rol === 'admin').length === 1) {
      alert('No puedes eliminar al único administrador');
      return;
    }
    if (!confirm('¿Eliminar este usuario?')) return;
    await saveUsuarios(usuarios.filter(u => u.id !== id));
  }

  const roleLabel = {
    admin: 'Administrador',
    responsable_cc: 'Responsable CC',
    lector: 'Solo lectura',
  };
  const roleBadge = {
    admin: { bg: '#FBF1D9', color: '#9C7A2B' },
    responsable_cc: { bg: '#D8EBD3', color: '#2D7A4E' },
    lector: { bg: '#E0E5EC', color: '#5C6B7F' },
  };

  return (
    <>
      <PageHeader title="Gestión de usuarios" subtitle="Cuentas y permisos del sistema"
        action={
          <button onClick={newUser}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
            <Plus size={16} /> Nuevo usuario
          </button>
        } />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KPI icon={Shield} label="Administradores" value={usuarios.filter(u => u.rol === 'admin').length} hint="Acceso total" />
        <KPI icon={User} label="Responsables CC" value={usuarios.filter(u => u.rol === 'responsable_cc').length} hint="Por centro de costo" />
        <KPI icon={Eye} label="Solo lectura" value={usuarios.filter(u => u.rol === 'lector').length} hint="Directivos / auditores" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5DDD0' }}>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Usuario</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Nombre</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Rol</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Centro de Costo</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: '#7A6F5C' }}>Contraseña</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const badge = roleBadge[u.rol] || roleBadge.lector;
                return (
                  <tr key={u.id} className="border-b last:border-b-0 hover:bg-stone-50" style={{ borderColor: '#E5DDD0' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#1E2A3A' }}>{u.usuario}</td>
                    <td className="px-4 py-3" style={{ color: '#1E2A3A' }}>{u.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded font-semibold"
                        style={{ background: badge.bg, color: badge.color }}>
                        {roleLabel[u.rol]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: u.centroCosto ? '#1E2A3A' : '#9C9080' }}>
                      {u.centroCosto || '— (todos)'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#7A6F5C' }}>
                      ••••••••
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => editUser(u)} className="p-1.5 rounded hover:bg-stone-200 mr-1" title="Editar">
                        <Edit3 size={14} style={{ color: '#1E2A3A' }} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded hover:bg-red-50" title="Eliminar">
                        <Trash2 size={14} style={{ color: '#B33B3B' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <UsuarioForm
          usuario={editing}
          setUsuario={setEditing}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function UsuarioForm({ usuario, setUsuario, isNew, onSave, onClose }) {
  const [showPwd, setShowPwd] = useState(false);
  function update(field, value) { setUsuario({ ...usuario, [field]: value }); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,42,58,0.6)' }}>
      <div className="rounded-lg max-w-2xl w-full" style={{ background: '#FAF7F0' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5DDD0' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: '#1E2A3A' }}>
            {isNew ? 'Nuevo usuario' : 'Editar usuario'}
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-200"><X size={18} /></button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <Field label="Nombre completo" full>
            <input type="text" value={usuario.nombre} onChange={(e) => update('nombre', e.target.value)}
              className={inputCls} placeholder="Ej. Juan Pérez Salazar" />
          </Field>
          <Field label="Usuario (login)">
            <input type="text" value={usuario.usuario} onChange={(e) => update('usuario', e.target.value.toLowerCase().replace(/\s/g, ''))}
              className={inputCls} placeholder="ej. jperez" />
          </Field>
          <Field label="Contraseña">
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={usuario.password}
                onChange={(e) => update('password', e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-md border text-sm bg-white" style={{ borderColor: '#E5DDD0' }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPwd ? <EyeOff size={14} style={{ color: '#7A6F5C' }} /> : <Eye size={14} style={{ color: '#7A6F5C' }} />}
              </button>
            </div>
          </Field>
          <Field label="Rol">
            <select value={usuario.rol} onChange={(e) => update('rol', e.target.value)} className={inputCls}>
              <option value="admin">Administrador (acceso total)</option>
              <option value="responsable_cc">Responsable de Centro de Costo</option>
              <option value="lector">Solo lectura (directivos)</option>
            </select>
          </Field>
          {usuario.rol === 'responsable_cc' && (
            <Field label="Centro de Costo asignado">
              <select value={usuario.centroCosto || ''} onChange={(e) => update('centroCosto', e.target.value)} className={inputCls}>
                {CENTROS_COSTO.map(cc => <option key={cc.codigo} value={cc.nombre}>{cc.nombre}</option>)}
              </select>
            </Field>
          )}
        </div>

        <div className="px-6 pb-4">
          <div className="p-3 rounded-md text-xs" style={{ background: '#F0E9D9', color: '#7A6F5C' }}>
            <strong style={{ color: '#9C7A2B' }}>Permisos según rol:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              <li><strong>Administrador:</strong> ve todo, edita todo, gestiona periodos, aprueba solicitudes y administra usuarios.</li>
              <li><strong>Responsable CC:</strong> ve y edita solo su Centro de Costo. Puede enviar solicitudes de apertura.</li>
              <li><strong>Solo lectura:</strong> ve todo el programa pero no puede modificar nada (uso directivo).</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: '#E5DDD0' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#1E2A3A' }}>Cancelar</button>
          <button onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
            style={{ background: '#1E2A3A', color: '#F5F1E8' }}>
            <Save size={14} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
