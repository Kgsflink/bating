const githubAPIKey = '';
const githubRepoOwner = 'Kgsflink';
const githubRepoName = 'tiranga_bating-';
const githubFilePath = 'dbs_5_minutes.json';

// Function to extract data from the current page
async function extractData() {
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
        await new Promise(resolve => setTimeout(resolve, 2000)); // Adjust the delay as needed
        const pageData = await extractData();
        allResults = allResults.concat(pageData);
        clickNext();
    }

    // Sort data by 'round' in ascending order
    allResults.sort((a, b) => {
        return parseInt(a.round) - parseInt(b.round);
    });

    return allResults;
}

// Function to update JSON file on GitHub
async function updateGitHubJSON(data) {
    const apiUrl = `https://api.github.com/repos/${githubRepoOwner}/${githubRepoName}/contents/${githubFilePath}`;

    try {
        // Fetch existing file details from GitHub
        const existingResponse = await fetch(apiUrl);
        if (!existingResponse.ok) {
            throw new Error(`Failed to fetch existing file details from GitHub: ${existingResponse.status}`);
        }
        const existingData = await existingResponse.json();
        const existingContent = atob(existingData.content); // decode existing content from base64
        const existingSha = existingData.sha;

        // Parse existing JSON content
        const parsedExistingContent = JSON.parse(existingContent);
        const existingRounds = new Set(parsedExistingContent.map(item => item.round));

        // Filter out duplicates from new data
        const newData = data.filter(item => !existingRounds.has(item.round));

        if (newData.length > 0) {
            // Merge existing and new data, sort by 'round' ascending
            const mergedData = [...parsedExistingContent, ...newData];
            mergedData.sort((a, b) => parseInt(a.round) - parseInt(b.round));

            // Convert merged data back to JSON string
            const updatedContent = JSON.stringify(mergedData, null, 2);

            // Prepare API request to update file
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubAPIKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Update latest data',
                    content: btoa(updatedContent), // encode content to base64
                    sha: existingSha, // provide the current sha
                }),
            });

            // Handle response
            if (!response.ok) {
                throw new Error(`Failed to update file on GitHub: ${response.status}`);
            }

            console.log('Data pushed to GitHub:', await response.json());
        } else {
            console.log('No new data to push to GitHub.');
        }
    } catch (error) {
        console.error('Error updating GitHub file:', error);
    }
}

// Extract data from the latest 10 pages and update GitHub JSON file
extractDataFromPages(10).then(latestResults => {
    updateGitHubJSON(latestResults);
});
