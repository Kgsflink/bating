// Function to extract data from the current page
function extractData() {
    const latestResults = [];
    const vanRows = document.querySelectorAll('.GameRecord__C-body .van-row');

    vanRows.forEach(row => {
        const cols = row.querySelectorAll('.van-col');
        if (cols.length >= 4) {
            const round = parseInt(cols[0].textContent.trim(), 10);
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

// Function to fetch existing data from GitHub
async function fetchExistingData(token, repo, path) {
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            // If the file does not exist, return an empty array
            return { data: [], sha: null };
        }
        throw new Error(`GitHub fetch failed: ${response.statusText}`);
    }

    const fileData = await response.json();

    // Safely parse the content and handle potential errors
    let existingData = [];
    try {
        existingData = JSON.parse(atob(fileData.content));
    } catch (e) {
        console.warn('Failed to parse existing data, starting with an empty array.');
    }

    return { data: existingData, sha: fileData.sha };
}

// Function to upload data to GitHub
async function uploadToGitHub(data, token, repo, path, sha) {
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    const content = btoa(JSON.stringify(data, null, 2)); // Base64 encode JSON data

    const result = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: 'Update data',
            content: content,
            sha: sha
        })
    });

    if (!result.ok) {
        throw new Error(`GitHub upload failed: ${result.statusText}`);
    }

    console.log('Data uploaded successfully.');
}

// Function to merge and sort data
function mergeAndSortData(existingData, newData) {
    const dataMap = new Map();

    // Add existing data to the map
    existingData.forEach(item => dataMap.set(item.round, item));

    // Add new data to the map, replacing existing entries if present
    newData.forEach(item => dataMap.set(item.round, item));

    // Convert map back to array and sort by round in descending order
    const mergedData = Array.from(dataMap.values());
    mergedData.sort((a, b) => b.round - a.round);

    return mergedData;
}

// Main function to handle the extraction and upload process
async function main() {
    const token = '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F';
    const repo = 'Kgsflink/tiranga_bating-';
    const path = 'tiranga/19_dbs.json';

    try {
        const newData = await extractDataFromPages(65);
        const { data: existingData, sha } = await fetchExistingData(token, repo, path);

        const mergedData = mergeAndSortData(existingData, newData);

        await uploadToGitHub(mergedData, token, repo, path, sha);
    } catch (error) {
        console.error(error);
    }
}

// Run the main function
main();
  
