import axios from 'axios';
import Notiflix from 'notiflix';
//import SimpleLightbox from 'simplelightbox';
//import 'simplelightbox/dist/simple-lightbox.min.css';

const API = 'https://pixabay.com/api/';
const API_KEY = '39567983-6d7096db9d40fece36970fd44';
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');
const form = document.getElementById('search-form');
const searchButton = document.getElementById('search-button');

let page = 1;
let currentSearchQuery = '';
let previousSearchQuery = '';
let totalHits = 0;
let isLoading = false;
let lightbox;
let notification;

const loadMoreImages = async () => {
  if (isLoading) return;

  page += 1;
  await searchImages(currentSearchQuery);
  if (gallery.childElementCount === totalHits) {
    showNotification(
      `We're sorry, but you've reached the end of search results.`
    );
  }
};

const handleFormSubmit = async event => {
  event.preventDefault();
  const searchQuery = event.target.searchQuery.value.trim();

  if (searchQuery === '') {
    window.location.reload();
    return;
  }

  previousSearchQuery = currentSearchQuery;
  currentSearchQuery = searchQuery;

  if (currentSearchQuery === previousSearchQuery) {
    showNotification('Please enter a different search query.');
    return;
  }

  page = 1;
  totalHits = 0;
  clearGallery();
  await searchImages(searchQuery);
};

const searchImages = async searchQuery => {
  const url = `${API}?key=${API_KEY}&q=${searchQuery}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=40`;

  isLoading = true;

  try {
    const response = await axios.get(url);
    const { hits, totalHits: foundImagesCount } = response.data;

    if (hits.length === 0) {
      showNotification(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    } else {
      totalHits = foundImagesCount;
      renderImages(hits);
      if (page === 1 && currentSearchQuery !== previousSearchQuery) {
        showTotalHitsNotification(totalHits);
      }
      if (hits.length >= 40 && gallery.childElementCount < totalHits) {
        showLoadMoreButton();
      } else {
        hideLoadMoreButton();
      }
    }
  } catch (error) {
    console.error(error);
    showNotification(
      'An error occurred while fetching images. Please try again later.'
    );
  } finally {
    isLoading = false;
  }
};

const renderImages = images => {
  const fragment = document.createDocumentFragment();

  images.forEach(image => {
    const card = createPhotoCard(image);
    fragment.appendChild(card);
  });

  gallery.appendChild(fragment);

  if (!lightbox) {
    lightbox = new SimpleLightbox('.gallery a', {});
  } else {
    lightbox.refresh();
  }
};

const createPhotoCard = image => {
  const card = document.createElement('div');
  card.className = 'photo-card';

  const link = document.createElement('a');
  link.href = image.largeImageURL;
  link.setAttribute('data-lightbox', 'gallery');
  link.setAttribute('data-title', image.tags);

  const img = document.createElement('img');
  img.src = image.webformatURL;
  img.alt = image.tags;
  img.loading = 'lazy';
  link.appendChild(img);

  card.appendChild(link);

  const info = document.createElement('div');
  info.className = 'info';

  const likes = createInfoItem('Likes', image.likes);
  const views = createInfoItem('Views', image.views);
  const comments = createInfoItem('Comments', image.comments);
  const downloads = createInfoItem('Downloads', image.downloads);

  info.appendChild(likes);
  info.appendChild(views);
  info.appendChild(comments);
  info.appendChild(downloads);

  card.appendChild(info);

  return card;
};

const createInfoItem = (label, value) => {
  const item = document.createElement('p');
  item.className = 'info-item';
  item.innerHTML = `<b>${label}:</b> ${value}`;
  return item;
};

const clearGallery = () => {
  gallery.innerHTML = '';
};

const showLoadMoreButton = () => {
  loadMoreBtn.style.display = 'block';
};

const hideLoadMoreButton = () => {
  loadMoreBtn.style.display = 'none';
};

const showNotification = message => {
  hideNotification();
  notification = Notiflix.Notify.info(message, {
    position: 'center',
    timeout: 3000,
    cssAnimationDuration: 200,
  });
};

const hideNotification = () => {
  if (notification) {
    notification.close();
    notification = null;
  }
};

const showTotalHitsNotification = totalHits => {
  Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`, {
    position: 'center',
    timeout: 3000,
    cssAnimationDuration: 200,
  });
};

const observer = new IntersectionObserver(
  entries => {
    if (entries[0].isIntersecting) {
      hideLoadMoreButton();
      loadMoreImages();
    }
  },
  { rootMargin: '10px' }
);

observer.observe(loadMoreBtn);

loadMoreBtn.addEventListener('click', loadMoreImages);
form.addEventListener('submit', handleFormSubmit);

document.addEventListener('DOMContentLoaded', () => {
  lightbox = new SimpleLightbox('.gallery a', {});
});

hideLoadMoreButton();
hideNotification();

form.addEventListener('submit', handleFormSubmit);
