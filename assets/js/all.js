function setVersion(id) {
    var elem = document.getElementById(id);
    var filepath = elem.getAttribute('src');
    var quest_mark_pos;
    do {
        quest_mark_pos = filepath.indexOf('?');
        if (quest_mark_pos == -1) {
            filepath += '?';
        }
    }
    while (quest_mark_pos == -1);

    filepath = filepath.substring(0, quest_mark_pos + 1);
    filepath += Date.now();

    elem.src = filepath;    
}

function setZoom() {
    var html = document.getElementsByTagName('html')[0],
    link = document.getElementById('js-zoom');
    if (link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            html.classList.toggle('is-zoomed');
        }, false);
    }
}