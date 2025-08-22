function goBack() {
    const ref = document.referrer; 
    if (ref.includes("iron_deficiency_effects.html")||ref.includes("iron_supplement_guide.html")) {
        window.location.href = "./iron_supplement_list.html";
    } else {
        history.back();
    }
}