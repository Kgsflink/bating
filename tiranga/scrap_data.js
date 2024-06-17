// Function to extract data from the current page
function extractData() {
    const latestResults = [];
    const vanRows = document.querySelectorAll('.GameRecord__C-body .van-row');

    vanRows.forEach(row => {
        const cols = row.querySelectorAll('.van-col');
        if (cols.length >= 4) {
            const round = cols[0].textContent.trim();
            const numElement = cols[1].querySelector('.GameRecord__C-body-num');
            const num = numElement ? numElement.textContent.trim() : '';
            const size = cols[2].textContent.trim();
            const originDivs = cols[3].querySelectorAll('.GameRecord__C-origin-I');
            const origins = Array.from(originDivs).map(div => div.className.split(' ')[1]);
            latestResults.push({ round, num, size, origins });
        }
    });
    
    return latestResults;
}

// Function to navigate to the next page
function clickNext() {
    const nextButton = document.querySelector('.GameRecord__C-foot-next .GameRecord__C-icon');
    if (nextButton) {
        nextButton.click();
    }
}

// Function to extract data from multiple pages
async function extractDataFromPages(totalPages) {
    let allResults = [];
    for (let page = 0; page < totalPages; page++) {
        // Wait for the page to load before extracting data
        await new Promise(resolve => setTimeout(resolve, 100)); // Adjust the delay as needed
        const pageData = extractData();
        allResults = allResults.concat(pageData);
        clickNext();
    }
    
    return allResults;
}

// Extract data from the latest 10 pages
extractDataFromPages(65).then(latestResults => {
    console.log(latestResults);
});
