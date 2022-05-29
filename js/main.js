/* Variables */
const mainContainer = document.getElementById('main-container');
const cardsContainer = document.getElementById('cards-container');

const sidebar = document.getElementById('sidebar');
const sidebarButton = document.getElementById('sidebar-button');
const sidebarClose = document.getElementById('sidebar-close');

const addCardText = document.getElementById('add-card-text');
const addCardButton = document.getElementById('add-card-button');

const boardsList = document.getElementById('boards-list');
const addBoardText = document.getElementById('add-board-text');
const addBoardButton = document.getElementById('add-board-button');

const deleteButton = document.getElementById('bucket');

const cardContextMenu = document.getElementById('card-context-menu');
const cardContextMenuDelete = document.getElementById('card-delete');
const cardContextMenuClear = document.getElementById('card-clear');

const title = document.getElementById('title');

const sound = document.getElementById('sound');
const noSound = document.getElementById('no-sound');
let audio = new Audio();
audio.src = "./sound/Beauty.mp3";

let appData = {
    'boards': [],
    'settings': {
        'userName': "User",
        'dataPersistence': true
    },
    'currentBoard': 0,
    'identifier': 0
};

function currentCards() {
    return appData.boards[appData.currentBoard].cards;
}

function currentBoard() {
    return appData.boards[appData.currentBoard];
}

/* Extensions */

// Move an item from the array to a specific index of the array.
Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

// Insert an item to a specific index of the array.
Array.prototype.insert = function(index, item) {
    this.splice( index, 0, item );
};


/* Utility functions */
function uniqueID() {
    appData.identifier += 1;
    return 'b' + appData.identifier;
}

// The card the mouse cursor is currently over.
function getMouseOverCard() {
    return document.querySelectorAll('.parent-card:hover')[0];
}

// The task the mouse cursor is currently over.
function getMouseOverItem() {
    return document.querySelectorAll('.parent-card > ul > li:hover')[0];
}

// Get an Item object from a list item element.
function getItemFromElement(element) {
    for (let card of currentCards()) {
        for (let item of card.items) {
            if (item.id === element.id) {
                return item;
            }
        }
    }
}

// Get a Card object from a card div element.
function getCardFromElement(element) {
    return currentCards().find(e => e.id === element.id);
}

// Get a board object from its unique id.
function getBoardFromId(id) {
    return appData.boards.find(b => b.id === id);
}

// List all the boards in the sidebar.
function listBoards() {
    boardsList.innerHTML = '';
    for (let board of appData.boards) {
        let boardTitle = document.createElement('li');
        boardTitle.innerText = board.name;
        boardTitle.id = board.id;
        if (board.id === currentBoard().id) boardTitle.classList.add('is-active');
        boardTitle.addEventListener('click', () => {
            renderBoard(board);
            listBoards();
        });
        boardsList.appendChild(boardTitle);
        saveData();
    }
}

function renderBoard(board) {
    appData.currentBoard = appData.boards.indexOf(board);
    document.title = 'Kadban | ' + currentBoard().name;
    title.innerText = currentBoard().name;
    renderCards();
}

// Refreshes the whole cards container.
function renderCards() {
    for (let card of cardsContainer.querySelectorAll('.parent-card')) {
        card.remove();
    }
    for (let card of currentCards()) {
        let generated = card.renderCard();
        cardsContainer.insertBefore(generated, cardsContainer.childNodes[cardsContainer.childNodes.length - 2]);
        card.update();
    }
}

// Sets whether hovering over cards/items changes their colors or not.
function toggleHoverStyle(show) {
    if (show) {
        let hoverStyle = document.createElement('style');
        hoverStyle.id = "dragHover";
        hoverStyle.innerHTML = ".parent-card:hover {background-color: #c7cbd1;}.parent-card > ul > li:hover {background-color: #d1d1d1;}";
        document.body.appendChild(hoverStyle);
    } else {
        let hoverStyle = document.getElementById('dragHover');
        hoverStyle.parentNode.removeChild(hoverStyle);
    }
}

// Adds a new board based on the input in the sidebar.
function addBoard() {
    let boardTitle = addBoardText.value;
    if (!boardTitle) return alert("Type a name for the board!");
    if (appData.boards.length >= 512) return alert("Max limit for boards reached.")
    addBoardText.value = '';

    let newBoard = new Board(boardTitle, uniqueID(), {'theme': null});
    appData.boards.push(newBoard);
    listBoards();
    saveData();
}

noSound.addEventListener("click", () => {
    sound.style.setProperty('visibility', 'visible');
    sound.style.setProperty('z-index', '2');
    noSound.style.setProperty('visibility', 'hidden');
    audio.volume = 0.5;
    audio.play();
})
sound.addEventListener('click', () => {
    sound.style.setProperty('visibility', 'hidden');
    sound.style.setProperty('z-index', '-1');
    noSound.style.setProperty('visibility', 'visible');
    audio.pause();
})

/* Classes */
class Item {

    constructor(title, description=null, id, parentCardId) {
        this.title = title;
        this.description = description;
        this.id = id;
        this.isDone = false;
        this.parentCardId = parentCardId;
    }

    getParentCard() {
        return document.getElementById(this.parentCardId);
    }

    check(chk=true) {
        this.isDone = chk;
        if (chk) {
            document.getElementById(this.id).style.textDecoration = 'line-through';
        } else {
            document.getElementById(this.id).style.textDecoration = 'none';
        }
    }

    update() {
        let element = document.getElementById(this.id);

        element.getElementsByTagName('p')[0].addEventListener('click', () => {
            if (this.isDone) {
                this.check(false);
            } else {
                this.check(true);
            }
        });

        element.addEventListener('mousedown', cardDrag_startDragging, false);
        this.check(this.isDone);
    }
}

class Card {

    constructor(name, id, parentBoardId) {
        this.name = name;
        this.items = [];
        this.id = id;
        this.parentBoardId = parentBoardId;
    }

    addItem(item) {
        this.items.push(item);
        renderCards();
        saveData();
    }

    removeItem(item) {
        this.items = this.items.filter(val => val !== item);
        renderCards();
        saveData();
    }

    update() {
        for (let item of this.items) {
            item.update();
        }
    }

    renderItems() {
        let newItemList = document.createElement('ul');
        newItemList.id = this.id + '-ul';
        for (let item of this.items) {
            let newItem = document.createElement('li');
            newItem.id = item.id;

            let newItemTitle = document.createElement('p');
            newItemTitle.innerText = item.title;
            newItemTitle.classList.add('item-title', 'text-fix', 'unselectable');

            let newItemButtons = document.createElement('span');

            let newItemEditButton = document.createElement('span');
            newItemEditButton.innerHTML = '<svg class="pencil" width="20px" height="20px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">\n' +
                '                    <defs>\n' +
                '                        <style>.cls-1{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;}</style>\n' +
                '                    </defs>\n' +
                '                    <title/>\n' +
                '                    <g  id="_28-pencil">\n' +
                '                        <polygon class="cls-1" points="1 23 1 31 9 31 31 9 23 1 1 23"/>\n' +
                '                        <line class="cls-1" x1="19" x2="27" y1="5" y2="13"/>\n' +
                '                        <line class="cls-1" x1="16" x2="24" y1="8" y2="16"/>\n' +
                '                        <line class="cls-1" x1="1" x2="9" y1="23" y2="31"/>\n' +
                '                        <line class="cls-1" x1="5" x2="17" y1="27" y2="15"/>\n' +
                '                    </g>\n' +
                '                </svg>'
            newItemEditButton.ariaHidden = true;
            newItemEditButton.classList.add('fa', 'fa-pencil');
            newItemEditButton.addEventListener('click', () => {

                let input = document.createElement('textarea');
                input.value = newItemTitle.textContent;
                input.classList.add('item-title');
                input.maxLength = 256;
                newItemTitle.replaceWith(input);

                let save = () => {
                    item.title = input.value;
                    renderCards();
                    saveData();
                };

                input.addEventListener('blur', save, {
                    once: true,
                });
                input.focus();
            });

            let newItemDeleteButton = document.createElement('span');
            newItemDeleteButton.innerHTML = '<svg class="bucket-icon" width="20px" height="20px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">\n' +
                '                    <defs>\n' +
                '                        <style>.cls-1{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;}</style>\n' +
                '                    </defs>\n' +
                '                    <title/>\n' +
                '                    <g id="_93-bin">\n' +
                '                        <rect id="rect1" class="cls-1" height="22" width="18" x="7" y="9"/>\n' +
                '                        <rect id="rect2" class="cls-1" height="4" width="22" x="5" y="5"/>\n' +
                '                        <polyline id="polyline" class="cls-1" points="12 5 12 1 20 1 20 5"/>\n' +
                '                        <line class="cls-1" x1="13" x2="13" y1="14" y2="31"/>\n' +
                '                        <line class="cls-1" x1="19" x2="19" y1="14" y2="31"/>\n' +
                '                    </g>\n' +
                '                </svg>'
            newItemDeleteButton.ariaHidden = true;
            newItemDeleteButton.classList.add('fa', 'fa-trash');
            newItemDeleteButton.addEventListener('click', () => {
                this.removeItem(item);
            });

            newItemButtons.appendChild(newItemEditButton);
            newItemButtons.appendChild(newItemDeleteButton);

            newItem.appendChild(newItemTitle);
            newItem.appendChild(newItemButtons);
            newItemList.appendChild(newItem);
        }

        return newItemList;
    }

    // The structure of the card element.
    renderCard() {
        let newCardHeader = document.createElement('span');
        let newCardHeaderTitle = document.createElement('h2');
        newCardHeaderTitle.id = this.id + '-h2';
        newCardHeaderTitle.innerText = this.name;
        newCardHeaderTitle.classList.add('text-fix', 'card-title');

        newCardHeaderTitle.addEventListener('click', (e) => {
            let input = document.createElement('input');
            input.value = newCardHeaderTitle.textContent;
            input.classList.add('card-title');
            input.maxLength = 128;
            newCardHeaderTitle.replaceWith(input);

            let save = () => {
                this.name = input.value;
                renderCards();
            };

            input.addEventListener('blur', save, {
                once: true,
            });
            input.focus();
        });

        let newCardHeaderMenu = document.createElement('span');
        newCardHeaderMenu.ariaHidden = true;
        newCardHeaderMenu.innerHTML = "&#9776;";
        newCardHeaderMenu.classList.add("fa", "fa-bars");
        newCardHeader.append(newCardHeaderTitle);
        newCardHeader.append(newCardHeaderMenu);
        newCardHeaderMenu.addEventListener('click', cardContextMenu_show);

        // Input area for typing in the name of new tasks for the card.
        let newInput = document.createElement('input');
        newInput.id = this.id + '-input';
        newInput.maxLength = 256;
        newInput.type = 'text';
        newInput.name = "add-todo-text";
        newInput.placeholder = "Add Task...";
        newInput.style.width = '83%'
        newInput.addEventListener('keyup', (e) => {
            if (e.code === "Enter") newButton.click();
        });

        // Button next to input to convert the text from the _newInput into an actual item in the card.
        let newButton = document.createElement('button');
        newButton.id = this.id + '-button';
        newButton.classList.add("plus-button");
        newButton.innerText = '+';
        newButton.addEventListener('click', () => {
            let inputValue = newInput.value;
            if (!inputValue) return alert("Type a name for the item!");
            let item = new Item(inputValue, null, getBoardFromId(this.parentBoardId).uniqueID(), this.id);
            this.addItem(item);
            newInput.value = '';
            newInput.focus();
        });

        let newCard = document.createElement('div');
        newCard.id = this.id;
        newCard.classList.add('parent-card');
        newCard.appendChild(newCardHeader);

        if (this.items) {
            let newItemList = this.renderItems();
            newCard.appendChild(newItemList);
        }
        newCard.appendChild(newInput);
        newCard.appendChild(newButton);

        return newCard;
    }
}

class Board {

    constructor(name, id, settings, identifier=0) {
        this.name = name;
        this.id = id;
        this.settings = settings;
        this.cards = [];
        this.identifier = identifier;
    }

    uniqueID() {
        this.identifier += 1;
        return 'e' + this.identifier.toString();
    }

    addCard() {
        let cardTitle = addCardText.value;
        addCardText.value = '';

        if (!cardTitle) cardTitle = `Untitled Card ${this.cards.length + 1}`;

        let card = new Card(cardTitle, this.uniqueID(), this.id);
        this.cards.push(card);

        let newCard = card.renderCard();
        cardsContainer.insertBefore(newCard, cardsContainer.childNodes[cardsContainer.childNodes.length - 2]);
        saveData();
    }
}

/* DragN'Drop */
let cardDrag_mouseDown = false;
let cardDrag_mouseDownOn = null;

const cardDrag_update = (e) => {
    if (!cardDrag_mouseDown && !cardDrag_mouseDownOn) return;

    cardDrag_mouseDownOn.style.left = e.pageX + 'px';
    cardDrag_mouseDownOn.style.top = e.pageY + 'px';
};

const cardDrag_startDragging = (e) => {

    if (e.target.tagName !== 'LI') return;

    cardDrag_mouseDown = true;
    cardDrag_mouseDownOn = e.target;

    cardDrag_mouseDownOn.style.position = 'absolute';

    toggleHoverStyle(true);
};

const cardDrag_stopDragging = (e) => {
    if (!cardDrag_mouseDown) return;

    toggleHoverStyle(false);

    let hoverCard = getMouseOverCard();
    if (hoverCard) {
        let hoverItem = getMouseOverItem();

        let hoverCardObject = getCardFromElement(hoverCard);
        let heldItemObject = getItemFromElement(cardDrag_mouseDownOn);

        if (hoverCard === heldItemObject.getParentCard()) {
            if (hoverItem) {
                if (hoverItem !== cardDrag_mouseDownOn) {
                    let hoverItemObject = getItemFromElement(hoverItem);
                    hoverCardObject.items.move(hoverCardObject.items.indexOf(heldItemObject), hoverCardObject.items.indexOf(hoverItemObject));
                }
            }
        } else {
            if (hoverItem) {
                if (hoverItem !== cardDrag_mouseDownOn) {
                    let hoverItemObject = getItemFromElement(hoverItem);

                    let hoverItemParentObject = getCardFromElement(hoverItemObject.getParentCard());

                    hoverItemParentObject.items.insert(hoverItemParentObject.items.indexOf(hoverItemObject), heldItemObject);

                    getCardFromElement(heldItemObject.getParentCard()).removeItem(heldItemObject);
                    heldItemObject.parentCardId = hoverItemParentObject.id;
                }
            } else {
                hoverCardObject.items.push(heldItemObject);

                getCardFromElement(heldItemObject.getParentCard()).removeItem(heldItemObject);
                heldItemObject.parentCardId = hoverCardObject.id;
            }
        }
        renderCards();
        saveData();
    }
    cardDrag_mouseDown = false;
    cardDrag_mouseDownOn.style.position = 'static';
    cardDrag_mouseDownOn = null;
};

mainContainer.addEventListener('mousemove', cardDrag_update);
mainContainer.addEventListener('mouseleave', cardDrag_stopDragging, false);
window.addEventListener('mouseup', cardDrag_stopDragging, false);


/* Drag Scrolling */
let scroll_mouseDown = false;
let scroll_startX, scroll_scrollLeft;

const scroll_startDragging = (e) => {
    scroll_mouseDown = true;
    scroll_startX = e.pageX - mainContainer.offsetLeft;
    scroll_scrollLeft = mainContainer.scrollLeft;
};

const scroll_stopDragging = (e) => {
    scroll_mouseDown = false;
};

const scroll_update = (e) => {
    e.preventDefault();
    if(!scroll_mouseDown || cardDrag_mouseDown) return;

    let scroll = (e.pageX - mainContainer.offsetLeft) - scroll_startX;
    mainContainer.scrollLeft = scroll_scrollLeft - scroll;
};

// Add the event listeners
mainContainer.addEventListener('mousemove', scroll_update);
mainContainer.addEventListener('mousedown', scroll_startDragging, false);
mainContainer.addEventListener('mouseup', scroll_stopDragging, false);
mainContainer.addEventListener('mouseleave', scroll_stopDragging, false);


/* Card Context Menu */
let cardContextMenu_currentCard;
const cardContextMenu_show = (e) => {

    cardContextMenu_currentCard = getMouseOverCard();

    const { clientX: mouseX, clientY: mouseY } = e;
    cardContextMenu.style.top = mouseY + 'px';
    cardContextMenu.style.left = mouseX + 'px';

    cardContextMenu.classList.remove('visible');
    setTimeout(() => {
        cardContextMenu.classList.add('visible');
    });

};

const cardContextMenu_hide = (e) => {
    if (e.target.offsetParent != cardContextMenu && cardContextMenu.classList.contains('visible')) {
        cardContextMenu.classList.remove("visible");
    }
};

const cardContextMenu_clearCard = () => {
    let currentCardObject = getCardFromElement(cardContextMenu_currentCard);

    currentCardObject.items.length = 0;
    cardContextMenu_hide({target:{offsetParent:'n/a'}});
    renderCards();
    saveData();
};

const cardContextMenu_deleteCard = () => {
    let currentCardObject = getCardFromElement(cardContextMenu_currentCard);

    currentCards().splice(currentCards().indexOf(currentCardObject), 1);
    cardContextMenu_hide({target:{offsetParent:'n/a'}});

    renderCards();
    saveData();
}


document.body.addEventListener('click', cardContextMenu_hide);
cardContextMenuClear.addEventListener('click', cardContextMenu_clearCard);
cardContextMenuDelete.addEventListener('click', cardContextMenu_deleteCard);


/* Persistent Data Storage */
function saveData() {
    window.localStorage.setItem('appData', JSON.stringify(appData));
}

function loadData() {
    let data = window.localStorage.getItem('appData');
    if (data) {
        let appData1 = JSON.parse(data);

        appData.settings = appData1.settings;
        appData.currentBoard = appData1.currentBoard;
        appData.identifier = appData1.identifier;

        for (let board of appData1.boards) {
            let newBoard = new Board(board.name, board.id, board.settings, board.identifier);

            for (let card of board.cards) {
                let newCard = new Card(card.name, card.id, board.id);

                for (let item of card.items) {
                    let newItem = new Item(item.title, item.description, item.id, card.id);
                    newCard.items.push(newItem);
                }
                newBoard.cards.push(newCard);
            }
            appData.boards.push(newBoard);
        }

        renderBoard(appData.boards[appData.currentBoard]);
    } else {
        let defaultBoard = new Board("Untitled Board", 'b0', {'theme': null});
        appData.boards.push(defaultBoard);
    }
    listBoards();
}

function clearData() {
    window.localStorage.clear();
}

loadData();

/* Other Events */
addCardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") currentBoard().addCard();
});

addCardButton.addEventListener('click', () => currentBoard().addCard());

addBoardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") addBoard();
});

addBoardButton.addEventListener('click', addBoard);

//e_saveButton.addEventListener('click', saveData);
// saveButton.addEventListener('click', () => {saveData(); alert("Data successfully saved.")});
//
deleteButton.addEventListener('click', () => {

    let boardName = currentBoard().name;

    // Delete the current board.
    appData.boards.splice(appData.currentBoard, 1);
    if (appData.boards.length === 0) {
        let defaultBoard = new Board("Untitled Board", 'b0', {'theme': null});
        appData.boards.push(defaultBoard);
        appData.currentBoard = 0;
    } else {
        appData.currentBoard--;
    }
    listBoards();
    renderBoard(appData.boards[0]);

    alert(`Deleted board "${boardName}"`)
    saveData();
});

/* Sidebar */
function toggleSidebar() {
    if (('toggled' in sidebar.dataset)) {
        delete sidebar.dataset.toggled;
        sidebar.style.width = "0";
    } else {
        sidebar.dataset.toggled = '';
        sidebar.style.width = "250px";
    }
}

sidebarButton.addEventListener('click', toggleSidebar);
sidebarClose.addEventListener('click', toggleSidebar);
