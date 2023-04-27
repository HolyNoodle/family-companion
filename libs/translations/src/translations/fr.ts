import { Locale } from "../types";

export default {
  long_date: "dddd DD MMMM",
  short_date: "DD/MM/YYYY",
  time: "LT",
  notifications: {
    actions: {
      quick: {
        action: "Déclencher",
        title: "Action rapide"
      },
      todo: {
        title: "Créer une tâche à faire",
        action: "Créer",
      },
      cancel: "Annuler",
      complete: "Terminer",
    },
  },
  routes: {
    dashboard: "Statistiques",
    schedule: "Calendrier",
    tasks: "Configuration",
  },
  task: {
    properties: {
      name: "Tâche",
      cron: "CRON",
      cronIterations: "Exemple d'iteration",
      description: "Description",
      id: "Identifiant",
      label: "Titre",
      quickAction: "Action rapide",
    },
    actions: {
      create: "Créer un tâche",
      download: "Sauvegarde",
      upload: "Importer",
      confirmDelete: "Êtes vous sûre de vouloir supprimer cette tâche ?",
    },
  },
} as Locale;
