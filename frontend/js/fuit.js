
/* Quand ma souris entre dans la zone de détection de souris */
$('.zone_survol').on('mouseenter',function(e){

	/* Détecte la taille de l'écran */
    var maxX = $(window).width() - $(this).width();
    var maxY = $(window).height() - $(this).height();    
    
    /* Change au hasard la position de la div qui bouge */
    $(this).css({
        'left':getRandomInt(0, maxX),
        'top':getRandomInt(0, maxY)
    });
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}