import React, { useEffect, useState } from 'react';
import styles from './styles/host.module.css';
import ReactWordcloud from 'react-wordcloud';
import Chat from './Chat';
import LeaderBoard from './LeaderBoard';

const Host = ({ socket }) => {
    const [wordsArePrepared, setWordsPrepared] = useState(false);
    const [text, setText] = useState('');
    const [words, setWords] = useState([]);
    const [code, setCode] = useState('');
    const [wordsArray, setWordsArray] = useState([]);
    const [wordsCloud, setWordsCloud] = useState([]);
    const [Messages, setMessages] = useState([]);
    const [userWordCounts, setUserWordCounts] = useState([]);
    const [unguessedWords, setUnguessedWords] = useState([]);

    const handleChange = (event) => {
        setText(event.target.value.toLowerCase());
    };

    useEffect(() => {
        socket.on("Message", (data) => {
            setMessages(prevMessages => [...prevMessages, data]);
        });

        socket.on("NewSuggestedWord", (data) => {
            setWords(prevWords => {
                const updatedWords = [...prevWords];
                const existingIndex = updatedWords.findIndex(item => item.name === data.name);

                if (existingIndex !== -1) {
                    const updatedWord = data.word.trim().toLowerCase();
                    if (!updatedWords[existingIndex].words.includes(updatedWord)) {
                        updatedWords[existingIndex].words.push(updatedWord);
                    }
                } else {
                    const newWordObject = { name: data.name, words: [data.word.trim().toLowerCase()], from: 'client' };
                    updatedWords.push(newWordObject);
                }

                return updatedWords;
            });
        });

        socket.on("GetRoomCode", (data) => {
            setCode(data);
        });

        return () => {
            socket.off("Message");
            socket.off("NewSuggestedWord");
            socket.off("GetRoomCode");
        };
    }, []);

    useEffect(() => {
        const wordsMap = [];

        words.forEach(item => {
            item.words.forEach(word => {
                if (text.includes(word)) {
                    wordsMap.push({ text: word, value: 1, from: item.from });
                }
            });
        });

        setWordsCloud(wordsMap);
    }, [words, text]);

    useEffect(() => {
        const newUserWordCounts = [];

        words.forEach(item => {
            let userCount = 0;
            item.words.forEach(word => {
                if (wordsArray.includes(word)) {
                    userCount++;
                }
            });

            newUserWordCounts.push({ name: item.name, count: userCount });
        });

        setUserWordCounts(newUserWordCounts);
    }, [words, wordsArray]);

    const generateColors = (words) => {
        const colors = {};
        words.forEach(word => {
            if (word.from === 'client') {
                colors[word.text] = 'green';
            } else {
                colors[word.text] = 'purple';
            }
        });

        return colors;
    };

    const colorsMap = generateColors(wordsCloud);

    const customOptions = {
        rotations: 0,
        fontSizes: [30, 30],
        colors: wordsCloud.map(word => colorsMap[word.text] || 'black'),
        enableTooltip: true,
        deterministic: false,
        fontFamily: 'impact',
        fontSizes: [20, 60],
        fontStyle: 'normal',
        fontWeight: 'normal',
        padding: 1,
        rotationAngles: [0, 90],
        scale: 'sqrt',
        spiral: 'archimedean',
        transitionDuration: 1000
    };

    const handleNextClick = () => {
        const newWordsArray = text.split(',').map(word => word.trim().toLowerCase());
        setWordsArray(newWordsArray);
        socket.emit("createTheRoom");
        setWordsPrepared(true);
    };

    const showUnguessedWords = () => {
        const guessedWordsSet = new Set(wordsCloud.map(word => word.text));
        const unguessedWordsList = wordsArray.filter(word => !guessedWordsSet.has(word));
        setUnguessedWords(unguessedWordsList);
        socket.off("NewSuggestedWord");
    };

    return (
        <div style={{ backgroundColor: "black", height: "100%", width: "100%" }}>
            {wordsArePrepared ? (
                <div style={{ width: "100%", height: "100%" }}>
                    <div className={styles.Hdr}>
                        <div style={{ backgroundColor: "white", fontSize: "24pt", fontWeight: "600", borderRadius: "30px", padding: "5px", width: "150px" }}>{code}</div>
                    </div>
                    <div style={{ display: "flex", width: "100%", height: "calc(100% - 46px)", flexDirection: "row" }}>
                        <div style={{ width: "400px", height: "calc(100% - 46px)" }}>
                            <Chat Messages={Messages}></Chat>
                        </div>
                        <div className={styles.Tree}>
                            <div style={{ height: "400px", width: "calc(100% - 300px)" }}>
                                <ReactWordcloud words={wordsCloud} options={customOptions} />
                            </div>
                            {unguessedWords.length > 0 && (
                                <div style={{ color: 'purple', marginTop: '20px' }}>
                                    <strong>Неотгаданные слова:</strong>
                                    <ul>
                                        {unguessedWords.map((word, index) => (
                                            <li key={index}>{word}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div></div>
                    </div>
                    <div style={{ backgroundColor: "black" }}>
                        <LeaderBoard Leaders={userWordCounts}></LeaderBoard>
                        <button onClick={showUnguessedWords} style={{ backgroundColor: "white", border: "none", padding: "5px 90px", margin: "20px" }}>Показать</button>
                    </div>
                </div>
            ) : (
                <div style={{ backgroundColor: "black", height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <strong style={{ color: "white", margin: "10px", fontSize: "20pt" }}>Введите загаданные слова</strong>
                    <textarea
                        className={styles.Input}
                        type="text"
                        value={text}
                        onChange={handleChange}
                        placeholder="Введите текст"
                    />
                    <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center" }}>
                        <button className={styles.BTNNext} onClick={handleNextClick}>Дальше</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Host;
