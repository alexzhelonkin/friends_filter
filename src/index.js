require('./style.css');

let myModule = {
    leftFriendList: undefined, //  left array with objects with friends
    rightFriendList: undefined, // right array with objects with friends
    init: function() {
        let self = this;

        function login() {
            return new Promise((resolve, reject) => {
                VK.init({
                    apiId: 8477069 //8477069
                });
                VK.Auth.login(function(result) {
                    if (result.status == 'connected') {
                        resolve();
                    } else {
                        reject();
                    }
                });
            });
        }
        // function receiving an array of objects with friends
        function callAPI(method, params) {
            return new Promise((resolve, reject) => {
                let firstList = document.getElementById('myFriends'),
                    secondList = document.getElementById('myFriendsList');
                if (localStorage.getItem('leftFriends') || localStorage.getItem('rightFriends')) {
                    let leftFriend = JSON.parse(localStorage.getItem('leftFriends'));
                    let rightFriend = JSON.parse(localStorage.getItem('rightFriends'));

                    leftFriend = leftFriend.leftArrayFriend;
                    rightFriend = rightFriend.rightArrayFriend;

                    self.leftFriendList = leftFriend;
                    self.rightFriendList = rightFriend;

                    firstList.innerHTML = myModule.createFriendsDiv(leftFriend);
                    secondList.innerHTML = myModule.createRightFriendsDiv(rightFriend);
                    if (leftFriend || rightFriend) {
                        resolve();
                    }

                } else {
                    VK.api(method, params, function(result) {
                        if (result.error) {
                            reject();
                        } else {
                            self.leftFriendList = result.response.items.sort(self.compare);
                            self.rightFriendList = [];

                            friendsList.innerHTML = self.createFriendsDiv(self.leftFriendList);
                            secondList.innerHTML = self.createRightFriendsDiv(self.rightFriendList);
                            resolve();
                        }
                    });
                }
            });
        }

        let friendsList = document.querySelector('#myFriends'),
            secondList = document.querySelector('#myFriendsList');

        login()
            .then(() => callAPI('friends.get', { v: 5.63, fields: ['photo_100'] }))
            .then(function(result) {
                self.setListeners();
            })
            .catch(() => console.log('Everything is bad!'));
    },
    //  friends
    createFriendsDiv: function(leftFriendList) {
        let templateFn = require('../friend-template.hbs');

        return templateFn({
            leftFriend: leftFriendList
        });
    },
    createRightFriendsDiv: function(rightFriendList) {
        let templateFn = require('../friend-template-added.hbs');

        return templateFn({
            rightFriend: rightFriendList
        });
    },
    // handlers DND
    setListeners: function() {
        let firstList = document.getElementById('myFriends'),
            secondList = document.getElementById('myFriendsList'),
            firstListUl = document.getElementById('firstFriendList'),
            secondListUl = document.getElementById('secondFriendList'),
            firstInput = document.querySelector('#input-search-leftFriend'),
            secondInput = document.querySelector('#input-search-rightFriend'),
            buttonSave = document.querySelector('#button'),
            homework = document.querySelector('#container'),
            leftArrayFriend = this.leftFriendList,
            rightArrayFriend = this.rightFriendList,
            self = myModule,
            item;
        //  save button in localStorage
        buttonSave.addEventListener('click', function() {
            localStorage.rightFriends = JSON.stringify({ rightArrayFriend });
            localStorage.leftFriends = JSON.stringify({ leftArrayFriend });
        });
        // search engine
        firstInput.addEventListener('keyup', () => {
            self.filtering(firstList, firstListUl, firstInput);
        });

        secondInput.addEventListener('keyup', () => {
            self.filtering(secondList, secondListUl, secondInput)
        });

        homework.addEventListener('click', (e) => {
            let elem = e.target.closest('LI'),
                icon = e.target,
                idFriend = icon.getAttribute('data-id');
            if (e.target.tagName === 'SPAN') {
                if (icon.className === 'icon-plus') {
                    firstListUl.removeChild(elem);
                    secondListUl.appendChild(elem);

                    icon.className = '';
                    icon.className = 'icon-cross';

                    for (let n = 0; n < leftArrayFriend.length; n++) {
                        if (leftArrayFriend[n].id == idFriend) {
                            rightArrayFriend.push(leftArrayFriend[n]);
                            leftArrayFriend.splice(n, 1);
                        }
                    }
                } else if (icon.className === 'icon-cross') {
                    secondListUl.removeChild(elem);
                    firstListUl.appendChild(elem);

                    icon.className = '';
                    icon.className = 'icon-plus';

                    for (let i = 0; i < rightArrayFriend.length; i++) {
                        if (rightArrayFriend[i].id == idFriend) {
                            leftArrayFriend.push(rightArrayFriend[i]);
                            rightArrayFriend.splice(i, 1);
                        }
                    }
                }

            }
        });

        firstList.addEventListener('dragstart', dragStart);
        secondList.addEventListener('dragstart', dragStart);
        //  DND
        function dragStart(e) {

            firstList.addEventListener('dragenter', dragEnter);
            secondList.addEventListener('dragenter', dragEnter);

            firstList.addEventListener('dragover', dragOver);
            secondList.addEventListener('dragover', dragOver);

            firstList.addEventListener('drop', dropElement);
            secondList.addEventListener('drop', dropElement);

            item = e.target;
        }

        function dragEnter(e) {
            e.preventDefault();
        }

        function dragOver(e) {
            e.preventDefault();
        }

        function dropElement(e) {
            let spanItem = item.lastElementChild,
                dragEnd = e.target.closest('UL');

            firstList.addEventListener('dragstart', dragStart);
            secondList.addEventListener('dragstart', dragStart);

            if (dragEnd.getAttribute('id') === 'secondFriendList') {
                secondListUl.appendChild(item);
                spanItem.className = '';
                spanItem.className = 'icon-cross';
                let idFriendSecond = spanItem.getAttribute('data-id');

                for (let n = 0; n < leftArrayFriend.length; n++) {
                    if (leftArrayFriend[n].id == idFriendSecond) {
                        rightArrayFriend.push(leftArrayFriend[n]);
                        leftArrayFriend.splice(n, 1);
                    }
                }
            } else if (dragEnd.getAttribute('id') === 'firstFriendList') {
                firstListUl.appendChild(item);
                spanItem.className = '';
                spanItem.className = 'icon-plus';
                let idFriend = spanItem.getAttribute('data-id');

                for (let i = 0; i < rightArrayFriend.length; i++) {
                    if (rightArrayFriend[i].id == idFriend) {
                        leftArrayFriend.push(rightArrayFriend[i]);
                        rightArrayFriend.splice(i, 1);
                    }
                }
            }
        }
    },
    // list search
    filtering: function(list, arrayFriends, input) {
        let filteringFirstList = [],
            value = input.value.trim();

        for (let i = 0; i < arrayFriends.children.length; i++) {
            let name = arrayFriends.children[i].textContent;
            if (myModule.isMatching(name, value)) {
                arrayFriends.children[i].style.display = 'block'
            }

            for (let i = 0; i < arrayFriends.children.length; i++) {
                let name = arrayFriends.children[i].textContent;
                if (!myModule.isMatching(name, value)) {
                    arrayFriends.children[i].style.display = 'none'
                }
            }
        }
    },

    isMatching: function(full, chunk) {
        let str = full.toLowerCase(),
            substr = chunk.toLowerCase();
        if (str.indexOf(substr) + 1) {
            return true;
        }
        return false;
    },
    //  the filtering function of the downloaded list
    compare: function(a, b) {
        if (a.last_name < b.last_name) return -1;
        if (a.last_name > b.last_name) return 1;
    },

};

// Close modal window
const modal = document.querySelector('.modal');
const close = document.querySelector('.close');

close.addEventListener('click', () => {
    modal.style.display = 'none';
})

myModule.init();