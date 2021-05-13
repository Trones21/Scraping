let companyInfoFull = [];
(async()=>{

    let failedRequests = [];
    for (let cID = 1330; cID < 1340; cID++) {

        try {

            let res = await fetch("https://www.linkedin.com/voyager/api/organization/companies?decorationId=com.linkedin.voyager.deco.organization.web.WebFullCompanyMain-27&q=universalName&universalName=" + cID, {
                "headers": {
                    "accept": "application/vnd.linkedin.normalized+json+2.1",
                    "accept-language": "en-US,en;q=0.9",
                    "csrf-token": "ajax:XXXXXXXXXXXXXXXXX",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-li-lang": "en_US",
                    "x-li-page-instance": "urn:li:page:d_flagship3_company;7rfyp4mfRlK/BXM/hXgEBg==",
                    "x-li-track": "{\"clientVersion\":\"1.6.7130\",\"osName\":\"web\",\"timezoneOffset\":2,\"deviceFormFactor\":\"DESKTOP\",\"mpName\":\"voyager-web\",\"displayDensity\":1,\"displayWidth\":1920,\"displayHeight\":1200}",
                    "x-restli-protocol-version": "2.0.0"
                },
                "referrer": "https://www.linkedin.com/search/results/companies/?keywords=managed%20it%20services&origin=GLOBAL_SEARCH_HEADER&page=2",
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "include"
            });

            let data = await res.json();

            if (res.status === 200) {
                console.log(data);
                parseData(data, cID);
            } else {
                failedRequests.push({
                    cID: cID,
                    statusCode: res.status
                })
            }
        } catch (e) {
            console.log(e);
        }

    }
    console.log(failedRequests);
    console.log(companyInfoFull);
}
)();

async function parseData(data, cID) {

    let industryCount = await data.included.filter((i)=>i["$type"] === "com.linkedin.voyager.common.Industry").length;
    let IndustryInfo = await data.included.filter((i)=>i["$type"] === "com.linkedin.voyager.common.Industry").map((i)=>{
        return {
            id: i.entityUrn.split(":")[3],
            localizedName: i.localizedName
        }
    }
    );

    let companyInfoMain = await data.included.filter((i)=>i["$type"] === "com.linkedin.voyager.organization.Company").filter((i)=>i["*followingInfo"].split(":")[6].toString() === cID.toString()).map((i)=>{

        //Multi-Step Transformations necessary before returning object
        let fundingData = parsefundingData(i);

        let CountriesList = (i.confirmedLocations) ? i.confirmedLocations.map((i)=>i.country) : null;
        let countriesListDeDup = (CountriesList) ? CountriesList.filter((item,index)=>{
            return CountriesList.indexOf(item) === index;
        }
        ).join(',') : null;
        

        return {
            //Basics
            NumID: i["*followingInfo"].split(":")[6],
            TextID: i.universalName,
            industryID: (i["*companyIndustries"]) ? i["*companyIndustries"][0].split(":")[3] : null,
            industryjoinID: IndustryInfo[0].id,
            industry: IndustryInfo[0].localizedName,
            industryCount: industryCount,
            CompanyName: (i.name) ? i.name : null,
            Website: (i.companyPageUrl) ? i.companyPageUrl : null,
            Founded: (i.foundedOn) ? i.foundedOn.year : null,
            EmployeesOnLinkedIn: i.staffCount,
            EmployeeCountRange: (i.staffCountRange) ? i.staffCountRange.start + " - " + i.staffCountRange.end : null,
            CompanyType: (i.companyType) ? i.companyType.localizedName : null,
            phone: (i.phone) ? i.phone.number : null,
            HQ_Country: (i.headquarter.country) ? i.headquarter.country : null,
            HQ_City: (i.headquarter.city) ? i.headquarter.city : null,
            HQ_geographicArea: (i.headquarter.geographicArea) ? i.headquarter.geographicArea : null,
            HQ_AddressLine1: (i.headquarter.line1) ? i.headquarter.line1 : null,
            HQ_AddressLine2: (i.headquarter.line2) ? i.headquarter.line2 : null,
            HQ_PostalCode: (i.headquarter) ? i.headquarter.postalCode : null,
            ConfirmedOperatingCountriesList: countriesListDeDup,
            tagline: (i.tagline) ? i.tagline : null,
            specialities: (i.specialities) ? i.specialities.toString() : null,
            description: (i.description) ? i.description : null,

            //Funding Round Info
            FundingRoundCount: (i.fundingdata) ? i.fundingData.numFundingRounds : null,
            LastFunding_Date: (fundingData.lastFundingRound.Date) ? fundingData.lastFundingRound.Date : null,
            LastFunding_AmountRaised: fundingData.lastFundingRound.AmountRaised,
            LastFunding_Currency: fundingData.lastFundingRound.Currency,

            //Addtional Fields you might want
            paidCompany: (i.paidCompany) ? i.paidCompany : null,
            isStaffingCompany: (i.staffingCompany) ? i.staffingCompany : null,
            locationCount: (i.confirmedLocations) ? i.confirmedLocations.length : null,
            acquirerCompany: (i.acquirerCompany) ? i.acquirerCompany : null,
            isSchool: (i.school) ? i.school : null,
            publishedProductsOwner: (i.publishedProductsOwner) ? i.publishedProductsOwner : null,
            topCompaniesListName: (i.topCompaniesListName) ? i.topCompaniesListName : null,
            rankForTopCompanies: (i.rankForTopCompanies) ? i.rankForTopCompanies : null,
            salesNavigatorCompanyUrl: (i.salesNavigatorCompanyUrl) ? i.salesNavigatorCompanyUrl : null,
            affiliatedCompaniesCount: "ImplementLater",
            affiliatedCompaniesIdList: "ImplementLater",
            associatedGroupsCount: (i.groups) ? i.groups.length : null,
            associatedGroupsIdList: (i.groups) ? i.groups.map((i)=>i.split(":")[3]).join(",") : null,
            showcasePagesCount: (i.showcasePages) ? i.showcasePages.length : null,
            showcasePagesIdList: (i.showcasePages) ? i.showcasePages.map((i)=>i.split(":")[3]).join(",") : null
        }
    }
    )

    companyInfoFull.push(...companyInfoMain);

}

function parsefundingData(i) {

    let fundingData = {
        numfundingRounds: null,
        lastFundingRound: {
            AmountRaised: null,
            Currency: null,
            Date: null
        }

    };
    if (i.fundingData) {
        fundingData.numfundingRounds = (i.fundingData.numFundingRounds) ? i.fundingData.numFundingRounds : null;
        if (i.fundingData.lastFundingRound) {
            fundingData.lastFundingRound.AmountRaised = (i.fundingData.lastFundingRound.moneyRaised) ? i.fundingData.lastFundingRound.moneyRaised.amount : null;
            fundingData.lastFundingRound.Currency = (i.fundingData.lastFundingRound.moneyRaised) ? i.fundingData.lastFundingRound.moneyRaised.currencyCode : null;

            if (i.fundingData.lastFundingRound.announcedOn) {

                let year = (i.fundingData.lastFundingRound.announcedOn.year) ? i.fundingData.lastFundingRound.announcedOn.year.toString() : "0001";
                let monthRaw = (i.fundingData.lastFundingRound.announcedOn.month) ? i.fundingData.lastFundingRound.announcedOn.month.toString() : "01";
                let month = (monthRaw.length === 1) ? "0" + monthRaw : monthRaw;
                let dayRaw = (i.fundingData.lastFundingRound.announcedOn.day) ? i.fundingData.lastFundingRound.announcedOn.day.toString() : "01"
                let day = (dayRaw.length === 1) ? "0" + dayRaw : dayRaw;
                fundingData.lastFundingRound.Date = year + "-" + month + "-" + day;
            }
        }
    }
    return fundingData;
}

function parseAffiliatedCompanies(i){

}
