    
(async function load() {

    async function getData(url) { 
        const res = await fetch(url)
        const data = await res.json()
        return data
    }

    const $home = document.getElementById('home')
    const $form = document.getElementById('form')
    const $featuringContainer = document.getElementById('featuring')

    function setAttributes($element, attributes) {
        for (const attribute in attributes) {
            $element.setAttribute(attribute, attributes[attribute])
        }
    }

    const BASE_API = 'https://yts.am/api/v2/'
    const USER_API = 'https://randomuser.me/api/'

    function featuringTemplate(peli) {
        return (
            `<div class="featuring">
                <div class="featuring-image">
                    <img src="${peli.medium_cover_image}" width="70" height="100" alt="">
                </div>
                <div class="featuring-content">
                    <p class="featuring-title">Pelicula encontrada</p>
                    <p class="featuring-album">${peli.title}</p>
                </div>
            </div>`
        )
    }

    $form.addEventListener('submit', async (ev) => {
        ev.preventDefault()
        $home.classList.add('search-active')
        $featuringContainer.style.display = 'grid'
        const $loader = document.createElement('img')
        setAttributes($loader, {
            src: 'src/images/loader.gif',
            height: 50,
            width: 50
        })

        if($featuringContainer.children.length > 0) {
            $featuringContainer.removeChild($featuringContainer.childNodes[0])
        }
        $featuringContainer.append($loader)
        
        try {
            const data = new FormData($form);
            const {
                data: {
                    movies: pelis
                }
            } = await getData(`${BASE_API}list_movies.json?limit=1&query_term=${data.get('name')}`)
            const htmlString = featuringTemplate(pelis[0])
            $featuringContainer.innerHTML = htmlString
        } catch (error) {
            alert('No se encontró ningún resultado' )
            $loader.remove()
            $home.classList.remove('search-active')
            $featuringContainer.style.display = 'none'
        }

    })

    function friendItemTemplate(friend) {
        return (
            `<li class="playlistFriends-item">
                <a href="#">
                    <img src="${friend.picture.thumbnail}" alt="echame la culpa" />
                    <span>
                    ${friend.name.first} ${friend.name.last}
                    </span>
                </a>
            </li>`
        )
    }

    function videoItemTemplate(movie, category) {
        return (
            `<div class="primaryPlaylistItem" data-id="${movie.id}" data-category=${category}>
                <div class="primaryPlaylistItem-image">
                    <img src="${movie.medium_cover_image}">
                </div>
                <h4 class="primaryPlaylistItem-title">
                    ${movie.title}
                </h4>
            </div>`
        )
    }

    function createTemplate(htmlString) { 
        const html = document.implementation.createHTMLDocument()
        html.body.innerHTML = htmlString;
        return html.body.children[0];
    }
    
    function addEventClick($element) {
        $element.addEventListener('click', (ev) => {
            showModal($element)
        })
    }

    function renderMovieList(list, $container, category) {
        //actionList.data.movies 
        $container.children[0].remove();
        
        list.forEach((movie) => {
            // template de la pelìcula
            const htmlString = videoItemTemplate(movie, category);
            // creación del html para el template
            const movieElement = createTemplate(htmlString)
            // adjuntar el template al container
            $container.append(movieElement);
            // busqueda de la imagen en el div
            const image = movieElement.querySelector('img')
            image.addEventListener('load', (ev) => {
                ev.srcElement.classList.add('fadeIn')
            })
            // animacion de fade
            addEventClick(movieElement);
            // $actionContainer.innerHTML += htmlString;
        })
    }

    function renderFriendList(list, container) {
        list.forEach(friend => {
            const htmlString = friendItemTemplate(friend)
            container.innerHTML += htmlString
        })
    }
    
    
    const $actionContainer = document.querySelector('#action')
    const $dramaContainer = document.getElementById('drama')
    const $animationContainer = document.getElementById('animation')
    const friendListContainer = document.getElementById('friendsList')

    async function cacheExist(category) {
        const listName = `${category}List`
        const cacheList = localStorage.getItem(listName)
        if(cacheList) {
            return JSON.parse(cacheList)
        } 
        const { data: { movies: data } } = await getData(`${BASE_API}list_movies.json?genre=${category}`);
        localStorage.setItem(listName, JSON.stringify(data))
        return data
    }

    async function cacheFriendList(list) {
        const cacheList = localStorage.getItem(list)
        if (cacheList) {
            return JSON.parse(cacheList)
        }

        const { results: data } = await getData(`${USER_API}?results=${Math.floor(Math.random() * (10 - 5) + 5)}`)
        localStorage.setItem(list, JSON.stringify(data))
        return data
    }
    
    const friendStorage = await cacheFriendList('friendlist')
    renderFriendList(friendStorage, friendListContainer)

    async function updateData(category, container) {
        const list = await cacheExist(category)
        renderMovieList(list, container, category)
        return list
    }

    let [actionStorage, dramaStorage, animationStorage] = await Promise.all([
        updateData('action', $actionContainer),
        updateData('drama', $dramaContainer),
        updateData('animation', $animationContainer)
    ])

    const $modal = document.getElementById('modal')
    const $overlay = document.getElementById('overlay')
    const $hideModal = document.getElementById('hide-modal')

    const $modalTitle = $modal.querySelector('h1')
    const $modalImage = $modal.querySelector('img')
    const $modalDescription = $modal.querySelector('p')

    function searchbyId(movieList, id) {
        return movieList.find(movie => movie.id === id)
    }

    function findMovie(id, category) {
        switch (category) {
            case 'action':
                return searchbyId(actionStorage, id)
                break;
            case 'drama':
                return searchbyId(dramaStorage, id)
                break;
            default:
                return searchbyId(animationStorage, id)
                break;
        }
    }

    function showModal($element) {
        $overlay.classList.add('active')
        $modal.style.animation = 'modalIn .8s forwards'
        const id = parseInt($element.dataset.id, 10)
        const category = $element.dataset.category
        const data = findMovie(id, category)
        
        $modalTitle.textContent = data.title
        $modalImage.setAttribute('src', data.medium_cover_image)
        $modalDescription.textContent = data.description_full
    }

    function hideModal() { 
        $overlay.classList.remove('active')
        $modal.style.animation = 'modalOut .8s forwards'
    }

    $hideModal.addEventListener('click', hideModal)
    $overlay.addEventListener('click', ev => {
        if(ev.target == $overlay) {
            hideModal()
        }
    })
})() 