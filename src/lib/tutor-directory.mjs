function normalize(value) {
  return value.toLocaleLowerCase('en').trim();
}

export function filterTutors(tutors, { category = 'All', query = '' } = {}) {
  const normalizedQuery = normalize(query);

  return tutors.filter((tutor) => {
    const matchesCategory = category === 'All' || tutor.category === category;
    const searchableText = [tutor.name, tutor.category, ...tutor.courses].join(' ');
    return matchesCategory && (!normalizedQuery || normalize(searchableText).includes(normalizedQuery));
  });
}

export function sortTutors(tutors, sortBy = 'name') {
  return [...tutors].sort((first, second) => {
    if (sortBy === 'courses') {
      const courseDifference = second.courses.length - first.courses.length;
      if (courseDifference !== 0) return courseDifference;
    }

    return first.name.localeCompare(second.name, 'en');
  });
}

export function contactLinks(tutor) {
  const firstPhoneNumber = tutor.phone.match(/\+[\d\s\u00a0]+/)?.[0] ?? tutor.phone;
  const dialablePhone = firstPhoneNumber.replace(/[^\d+]/g, '');

  return {
    email: `mailto:${tutor.email}`,
    phone: `tel:${dialablePhone}`,
  };
}

function createContactLink(document, label, value, href) {
  const link = document.createElement('a');
  const labelElement = document.createElement('span');
  const valueElement = document.createElement('span');

  link.href = href;
  link.className = 'tutor-contact-link';
  labelElement.className = 'tutor-contact-label';
  labelElement.textContent = label;
  valueElement.textContent = value;
  link.append(labelElement, valueElement);
  return link;
}

export function initializeTutorDirectory(root, tutors) {
  if (!root || root.hasAttribute('data-ready')) return;
  root.setAttribute('data-ready', '');

  const search = root.querySelector('[data-search]');
  const sort = root.querySelector('[data-sort]');
  const filters = [...root.querySelectorAll('[data-filter]')];
  const grid = root.querySelector('[data-grid]');
  const count = root.querySelector('[data-count]');
  const empty = root.querySelector('[data-empty]');
  const cards = new Map(
    [...root.querySelectorAll('[data-tutor-card]')].map((card) => [Number(card.dataset.tutorId), card]),
  );
  const indexedTutors = tutors.map((tutor, id) => ({ ...tutor, id }));
  let category = 'All';

  const render = () => {
    const visibleTutors = sortTutors(
      filterTutors(indexedTutors, { category, query: search?.value ?? '' }),
      sort?.value ?? 'name',
    );
    const visibleIds = new Set(visibleTutors.map((tutor) => tutor.id));

    for (const [id, card] of cards) card.hidden = !visibleIds.has(id);
    for (const tutor of visibleTutors) grid?.append(cards.get(tutor.id));

    if (count) count.textContent = `${visibleTutors.length} ${visibleTutors.length === 1 ? 'listing' : 'listings'} found`;
    if (empty) empty.hidden = visibleTutors.length !== 0;
  };

  search?.addEventListener('input', render);
  sort?.addEventListener('change', render);
  for (const filter of filters) {
    filter.addEventListener('click', () => {
      category = filter.dataset.filter ?? 'All';
      for (const button of filters) button.setAttribute('aria-pressed', String(button === filter));
      render();
    });
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-show-contact]');
    if (!button || !root.contains(button)) return;

    const card = button.closest('[data-tutor-card]');
    const tutor = indexedTutors[Number(card?.dataset.tutorId)];
    const contact = card?.querySelector('[data-contact]');
    if (!tutor || !contact) return;

    const links = contactLinks(tutor);
    contact.replaceChildren(
      createContactLink(root.ownerDocument, 'Email', tutor.email, links.email),
      createContactLink(root.ownerDocument, 'Phone', tutor.phone, links.phone),
    );
    contact.hidden = false;
    button.hidden = true;
    button.setAttribute('aria-expanded', 'true');
    contact.querySelector('a')?.focus();
  });

  render();
}
