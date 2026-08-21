const programmes = {
  dsai: {
    name: 'Data Science and Artificial Intelligence',
    href: 'https://go.msvincognito.nl/ddssaaii',
  },
  cs: {
    name: 'Computer Science',
    href: 'https://go.msvincognito.nl/ccss',
  },
  masters: {
    name: 'Master’s students',
    href: 'https://go.msvincognito.nl/mmaasstteerr',
  },
};

export function initializeIntroDays({ document, search, currentYear }) {
  const year = document.getElementById('intro-days-year');
  const programmeSection = document.getElementById('intro-days-programme');
  const programmeName = document.getElementById('intro-days-programme-name');
  const programmeLink = document.getElementById('intro-days-programme-link');

  if (year) year.textContent = `${currentYear}-${currentYear + 1}`;
  if (!programmeSection || !programmeName || !programmeLink) return;

  programmeSection.hidden = true;
  programmeName.textContent = '';
  programmeLink.href = '';

  const programmeKey = new URLSearchParams(search).get('programme');
  const programme = programmeKey ? programmes[programmeKey] : null;
  if (!programme) return;

  programmeName.textContent = programme.name;
  programmeLink.href = programme.href;
  programmeSection.hidden = false;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeIntroDays({
    document,
    search: window.location.search,
    currentYear: new Date().getFullYear(),
  });
}
