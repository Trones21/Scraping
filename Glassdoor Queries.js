(async()=>{
    let Data = [];
    let skipped = [];
    //for (i = 1; i < 100; i = i + 50) {
    for (i = 1250000; i < 3850001; i = i + 2500) {
        //Sleep between 1 and 5 seconds
        try{ 
        await sleep(Math.round(Math.random() * 5000))
        let queryStr = await constructQueryString(i, 2500)
        let json = await callAPI(queryStr);
        Data.push(Object.values(json.data));
        } catch(err){
            skipped.push(err)
            console.log(err)
        }
        console.log(i + " :  " + now);
    }
    console.log("Done Scraping. Writing Now - Failed writes will be logged to console");
    console.log(skipped);
    let flatArr = await Data.flat()

    //Break up json to avoid stringify out of memory error
    let recordsPerFile = 500000;
    let chunks = chunkArray(flatArr, Math.ceil(flatArr.length / recordsPerFile))
    for (chunk of chunks) {
        try{
           let cleanData = JSON.stringify(chunk);
           writeJSON(cleanData, "Companies0t178k"); 
        }
        catch{
            console.log(chunk);
        }
        
    }
}
)()

function sleep(ms) {
    return new Promise(resolve=>setTimeout(resolve, ms));
}

function constructQueryString(startID, companyCount) {
    let query = "query {"
    endID = startID + companyCount
    for (id = startID; id < endID; id++) {
        query += `c${id}:employer(id:${id}){...myFields},`
    }
    query += `} fragment myFields on Employer{\
        id, name, activeStatus, approvalStatus, stock, status, yearFounded, size,\
        parent{employerId}\,ceo{name, dateStarted},\
        primaryIndustry{industryName, sectorName},\
        ratings{\
            overallRating,ceoRating,recommendToFriendRating,businessOutlookRating,cultureAndValuesRating,careerOpportunitiesRating,workLifeBalanceRating,seniorManagementRating,compensationAndBenefitsRating,diversityAndInclusionRating\
            },\
        counts{\
            jobCount, salaryCount, reviewCount, interviewCount,followerCount\
            },\
        revenue, website, headquarters,\
        }`
    //Need logic to find the headquarters location
    //officeAddresses{officeLocationId,addressLine1,addressLine2,cityName,postalCode,countryName}\

    //console.log(query)
    return query
}

async function callAPI(queryStr) {
    let status = 0;
    let fails = 0;
    while (status !== 200) {
        try {
            const res = await fetch("https://www.glassdoor.com/api-internal/api.htm?action=contentgraph&version=1", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin"
                },
                "referrer": "https://www.glassdoor.com/",
                "referrerPolicy": "origin",
                "body": "{\"query\":\"" + queryStr + "\"}",
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });
            status = res.status;
            if (status === 200) {
                const data = await res.json();
                return data
            }
            ;
        } catch (err) {

            fails += 1;
            console.log(fails + " fails : " + queryStr.substring(0, 50))
        }
    }
}

function chunkArray(arr, chunkCount) {
    const chunks = [];
    while (arr.length) {
        const chunkSize = Math.ceil(arr.length / chunkCount--);
        const chunk = arr.slice(0, chunkSize);
        chunks.push(chunk);
        arr = arr.slice(chunkSize);
    }
    return chunks;
}

function writeJSON(cleanData, fileNameNoExt) {

    let data = new Blob([cleanData],{
        type: "text/plain"
    });
    let url = window.URL.createObjectURL(data);

    let dLink = document.createElement("a");
    dLink.setAttribute("href", url);
    dLink.download = fileNameNoExt + ".json";
    dLink.click();
}
