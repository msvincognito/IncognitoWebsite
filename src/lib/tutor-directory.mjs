function normalize(value) {
  return value.toLocaleLowerCase('en').trim();
}

export function groupTutorListings(listings) {
  const tutorsByContact = new Map();

  for (const listing of listings) {
    const key = normalize(listing.email || listing.name);
    let tutor = tutorsByContact.get(key);

    if (!tutor) {
      tutor = {
        name: listing.name,
        email: listing.email,
        phone: listing.phone,
        pay: listing.pay,
        categories: [],
        courses: [],
      };
      tutorsByContact.set(key, tutor);
    }

    if (!tutor.categories.includes(listing.category)) tutor.categories.push(listing.category);

    for (const courseName of listing.courses) {
      let course = tutor.courses.find((candidate) => candidate.name === courseName);
      if (!course) {
        course = { name: courseName, categories: [] };
        tutor.courses.push(course);
      }
      if (!course.categories.includes(listing.category)) course.categories.push(listing.category);
    }
  }

  return [...tutorsByContact.values()];
}

export function coursesForCategory(tutor, category = 'All') {
  if (category === 'All') return tutor.courses;
  return tutor.courses.filter((course) => course.categories.includes(category));
}

export function filterTutors(tutors, { category = 'All', query = '' } = {}) {
  const normalizedQuery = normalize(query);

  return tutors.filter((tutor) => {
    const matchesCategory = category === 'All' || tutor.categories.includes(category);
    const searchableText = [tutor.name, ...tutor.categories, ...tutor.courses.map((course) => course.name)].join(' ');
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

export function tutorCountLabel(count) {
  return `${count} ${count === 1 ? 'tutor' : 'tutors'} found`;
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
  const indexedTutors = groupTutorListings(tutors).map((tutor, id) => ({ ...tutor, id }));
  let category = 'All';

  const updateCardCourses = (card, tutor, selectedCategory = 'All') => {
    const visibleCourses = new Set(coursesForCategory(tutor, selectedCategory).map((course) => course.name));
    const courseItems = [...card.querySelectorAll('[data-course]')];
    for (const item of courseItems) item.hidden = !visibleCourses.has(item.dataset.course);

    const courseCount = card.querySelector('[data-course-count]');
    if (courseCount) {
      const size = visibleCourses.size;
      courseCount.textContent = `${size} ${size === 1 ? 'course' : 'courses'}`;
    }

    for (const button of card.querySelectorAll('[data-course-filter]')) {
      button.setAttribute('aria-pressed', String(button.dataset.courseFilter === selectedCategory));
    }
  };

  const render = () => {
    const visibleTutors = sortTutors(
      filterTutors(indexedTutors, { category, query: search?.value ?? '' }),
      sort?.value ?? 'name',
    );
    const visibleIds = new Set(visibleTutors.map((tutor) => tutor.id));

    for (const [id, card] of cards) card.hidden = !visibleIds.has(id);
    for (const tutor of visibleTutors) grid?.append(cards.get(tutor.id));

    if (count) count.textContent = tutorCountLabel(visibleTutors.length);
    if (empty) empty.hidden = visibleTutors.length !== 0;
  };

  search?.addEventListener('input', render);
  sort?.addEventListener('change', render);
  for (const filter of filters) {
    filter.addEventListener('click', () => {
      category = filter.dataset.filter ?? 'All';
      for (const button of filters) button.setAttribute('aria-pressed', String(button === filter));
      for (const tutor of indexedTutors) {
        const card = cards.get(tutor.id);
        if (card) updateCardCourses(card, tutor, 'All');
      }
      render();
    });
  }

  root.addEventListener('click', (event) => {
    const courseFilter = event.target.closest('[data-course-filter]');
    if (courseFilter && root.contains(courseFilter)) {
      const card = courseFilter.closest('[data-tutor-card]');
      const tutor = indexedTutors[Number(card?.dataset.tutorId)];
      if (card && tutor) updateCardCourses(card, tutor, courseFilter.dataset.courseFilter ?? 'All');
      return;
    }

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
