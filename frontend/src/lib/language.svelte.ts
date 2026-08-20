const STORAGE_KEY = "showTranslated";

function getStoredShowTranslated(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== "false"; // default true
}

export const language = $state<{ showTranslated: boolean }>({
  showTranslated: getStoredShowTranslated(),
});

export function toggleShowTranslated() {
  language.showTranslated = !language.showTranslated;
  localStorage.setItem(STORAGE_KEY, String(language.showTranslated));
}

export function displayTitle(event: { title: string; translatedTitle: string | null }): string {
  return language.showTranslated && event.translatedTitle ? event.translatedTitle : event.title;
}
