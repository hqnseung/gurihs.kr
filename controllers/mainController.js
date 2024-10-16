const axios = require('axios');
const renderTemplate = require("../utils/renderTemplate");
const { formatDate, formatDateForDisplay } = require("../utils/utils");
const Post = require('../models/Post');

// @desc View Main Page
// @route GET /main
const getMainPage = async (req, res) => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530054&KEY=6b2c5a8bd8284662bf5be43ffb875dc4&MLSV_YMD=${date}`;
    
    let currentDate = new Date();
    
    const fetchLunchInfo = async () => {
        let lunch = "오늘의 급식정보가 존재하지 않습니다.";
        let attempts = 0;
        let foundDate = formatDateForDisplay(currentDate);
        
        while (attempts < 4) {
            try {
            const urlWithDate = url.replace(date, formatDate(currentDate));
            const response = await axios.get(urlWithDate);
            if (response.data.RESULT && response.data.RESULT.CODE === "INFO-200") {
                attempts++;
                currentDate.setDate(currentDate.getDate() + 1);
                foundDate = formatDateForDisplay(currentDate); 
            } else {
                const data = response.data;
                const ddishNm = data.mealServiceDietInfo[1].row[0].DDISH_NM;
                lunch = ddishNm;
                foundDate = formatDateForDisplay(currentDate);
                break;
            }
            } catch (error) {
                console.error("Error fetching the lunch menu:", error);
                break;
            }
        }
        
        renderTemplate(res, req, "main.ejs", { lunch, date: foundDate });
    };
    
    fetchLunchInfo();
}

// @desc View Main Page
// @route GET /board
const getBoardPage = async (req, res) => {
    const postList = await Post.find();
    renderTemplate(res, req, "board.ejs", { postList });                                   
}

// @desc View Post
// @route GET /board/:id
const getPostPage = async (req, res) => {
    const id = req.params.id                                                         
    if (id && id.match(/^[0-9a-fA-F]{24}$/) && await Post.findById(id)) {
        const post = await Post.findById(id);
        renderTemplate(res, req, "view.ejs", { post });
    } else {
        res.redirect("/board")
    }                                   
}


module.exports = { getMainPage, getBoardPage, getPostPage }