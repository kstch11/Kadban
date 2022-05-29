function svgClick(act) {
    if (act==1) {
        $('#bucket').css("transform", "scale(" + 1.1 + ")");
        setTimeout(() => {
            $('#bucket').css("transform", "scale(" + 1 + ")");
        }, 300);
    } else {
        $('#bucket').css("transform", "scale(" + 1 + ")");
    }
    
}