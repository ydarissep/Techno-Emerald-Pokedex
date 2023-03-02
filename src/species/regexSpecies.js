function regexSpecies(textSpecies, species){
    const lines = textSpecies.split("\n")
    let formsStart = null, ID = 0

    lines.forEach(line => {

        if (/#define *FORMS_START *\w+/i.test(line))
            formsStart = ID

        const matchSpecies = line.match(/#define *(SPECIES_\w+)/i)
        if(matchSpecies !== null && /SPECIES_NONE/i.test(line) !== true && /SPECIES_EGG/i.test(line) !== true){
            const name = matchSpecies[1]


            matchInt = line.match(/\d+/g)
            if(matchInt !== null){
                ID = parseInt(matchInt[matchInt.length-1])



                species[name] = {}
                species[name]["name"] = name


                if(Number.isInteger(formsStart))
                    species[name]["ID"] = ID+formsStart
                else
                    species[name]["ID"] = ID
            }
        }
    })
    return species
}









function regexBaseStats(textBaseStats, species){
    const lines = textBaseStats.split("\n")

    const regex = /baseHP|baseAttack|baseDefense|baseSpeed|baseSpAttack|baseSpDefense|type1|type2|item1|item2|eggGroup1|eggGroup2|abilities/i
    let stop = false, value, name

    lines.forEach(line => {

        if(/#else/i.test(line))
                stop = true
        if(/#endif/i.test(line))
                stop = false


        const matchSpecies = line.match(/SPECIES_\w+/i)
        if(matchSpecies !== null){
            name = matchSpecies[0]
            change = false
        }


        if(name !== "SPECIES_NONE" && name !== "SPECIES_EGG"){
            const matchRegex = line.match(regex)
            if(matchRegex !== null){
                const match = matchRegex[0]



                if(match === "baseHP" || match === "baseAttack" || match === "baseDefense" || match === "baseSpeed" || match === "baseSpAttack" || match === "baseSpDefense"){
                    const matchInt = line.match(/\d+/)
                    if(matchInt !== null)
                        value = parseInt(matchInt[0])
                }
                else if(match === "type1" || match === "type2" || match === "item1" || match === "item2" || match === "eggGroup1" || match === "eggGroup2"){
                    value = line.match(/\w+_\w+/i)
                    if(value !== null)
                        value = value[0]
                }
                else if(match === "abilities"){
                    value = line.match(/ABILITY_\w+/ig)
                    if(value !== null){
                        for (let i = 0; i < 3; i++){
                            if(value[i] === "ABILITY_NONE" || value[i] === undefined && i >= 1)
                                value[i] = value[i-1]
                        }
                    }
                }



                if(!stop){
                    species[name][match] = value
                }
            }
        }
    })
    return getBST(species)
}




















function regexChanges(textChanges, species){
    const lines = textChanges.split("\n")

    const regex = /baseHP|baseAttack|baseDefense|baseSpeed|baseSpAttack|baseSpDefense|type1|type2|abilities/i
    let stop = false, value, name, buildDefines = true, defines = {}, define = "", keep = false, argument = [], argumentDefine = []

    for(let i = 0; i < lines.length; i++){
        const line = lines[i]
        if(buildDefines && /gSpeciesInfo/i.test(line)){
            buildDefines = false
        }
        if(buildDefines){
            const matchDefine = line.match(/#define (.*)/i)
            if(matchDefine !== null){
                if(!/\\/.test(line)){
                    Object.keys(defines).forEach(testDefine => {
                        const tempDefine = testDefine.match(/(\w+)/)
                        if(tempDefine[1] && line.includes(tempDefine[1])){
                            define = matchDefine[1].replace(testDefine, "").trim()
                            defines[define] = defines[testDefine]
                        }
                    })
                }
                else{
                    define = matchDefine[1].replaceAll("\\", "").trim()
                    defines[define] = []
                }
            }
            else if(keep && define in defines){
                defines[define].push(line)
            }
            if(/\\/.test(line)){
                keep = true
            }
            else{
                keep = false
            }
        }
        else{

            if(/#else/i.test(line))
                    stop = true
            if(/#endif/i.test(line))
                    stop = false


            const matchSpecies = line.match(/\[(SPECIES_\w+)\] *=(.*)/i)
            if(matchSpecies !== null){
                name = matchSpecies[1]
                stop = false
                argument = []
                argumentDefine = []

                if(name !== "SPECIES_NONE" && name !== "SPECIES_EGG"){

                    if(matchSpecies[2]){
                        matchDefine = matchSpecies[2].replaceAll(",", "").trim().match(/(\w+)(.*)/)
                        define = matchDefine[1]
                        if(matchDefine[2]){
                            argument = matchDefine[2].match(/\w+/g)
                        }
                        Object.keys(defines).forEach(testDefine => {
                            testDefine = testDefine.match(/(\w+)(.*)/)
                            if(testDefine[1] && testDefine[1] === define){
                                define = testDefine[0]
                                if(testDefine[2]){
                                    argumentDefine = testDefine[2].match(/\w+/g)
                                }
                            }
                        })
                        if(define in defines){
                            for(let j = 0; j < defines[define].length; j++){
                                let newLine = defines[define][j].replaceAll(" ", "").replaceAll("}", ",")
                                for(let k = 0; k < argument.length; k++){
                                    newLine = newLine.replace(`${argumentDefine[k]},`, `${argument[k]},`)
                                }
                                lines.splice(i+1, 0, newLine)
                            }
                        }
                    }
                }
            }

            if(/^\w+/.test(line.trim())){
                define = ""
                Object.keys(defines).forEach(testDefine => {
                    const tempDefine = testDefine.match(/(\w+)/)
                    if(tempDefine[1] && line.includes(tempDefine[1])){
                        define = testDefine
                    }
                })
                if(define in defines){
                    for(let j = 0; j < defines[define].length; j++){
                        lines.splice(i+1, 0, defines[define][j])
                    }
                }
            }


            if(name !== "SPECIES_NONE" && name !== "SPECIES_EGG"){
                const matchRegex = line.match(regex)

                if(matchRegex !== null){
                    let match = matchRegex[0]



                    if(match === "baseHP" || match === "baseAttack" || match === "baseDefense" || match === "baseSpeed" || match === "baseSpAttack" || match === "baseSpDefense"){
                        const matchInt = line.match(/\d+/)
                        if(matchInt !== null)
                            value = parseInt(matchInt[0])
                    }
                    else if(match === "type1" || match === "type2"){
                        value = line.match(/\w+_\w+/i)
                        if(value !== null)
                            value = value[0]
                    }
                    else if(match === "abilities"){
                        value = line.match(/ABILITY_\w+/ig)
                        if(value !== null){
                            for (let i = 0; i < 3; i++){
                                if(value[i] === "ABILITY_NONE" || value[i] === undefined && i >= 1)
                                    value[i] = value[i-1]
                            }
                        }
                    }

                    if(stop === false){
                        if(name in species){
                            if(match in species[name] && JSON.stringify(species[name][match]) != JSON.stringify(value)){
                                species[name]["changes"].push([match, value])
                            }   
                        }
                    }
                }
            }
        }
    }
    return species
}























function getLevelUpLearnsetsConversionTable(textLevelUpLearnsetsPointers){
    const lines = textLevelUpLearnsetsPointers.split("\n")
    let conversionTable = {}

    lines.forEach(line => {

        const matchSpecies = line.match(/SPECIES_\w+/i)
        if(matchSpecies != null && /SPECIES_NONE/i.test(line) !== true){
            const value = matchSpecies[0]


            const matchConversion = line.match(/s\w+LevelUpLearnset/i)
            if(matchConversion !== null){
                const index = matchConversion[0]


                if(conversionTable[index] === undefined) // DO NOT TOUCH THAT FUTURE ME, THIS IS THE WAY, DON'T QUESTION ME
                    conversionTable[index] = [value]
                else // DO NOT TOUCH THAT FUTURE ME, THIS IS THE WAY, DON'T QUESTION ME
                    conversionTable[index].push(value)
            }
        }
    })
    return conversionTable
}

function regexLevelUpLearnsets(textLevelUpLearnsets, conversionTable, species){
    const lines = textLevelUpLearnsets.split("\n")
    let speciesArray = []

    lines.forEach(line => {
        const matchConversion = line.match(/s\w+LevelUpLearnset/i)
        if(matchConversion !== null){
            const index = matchConversion[0]
            speciesArray = conversionTable[index]
        }


        const matchLevelMove = line.match(/(\d+) *, *(MOVE_\w+)/i)
        if(matchLevelMove !== null && speciesArray){
            const level = parseInt(matchLevelMove[1])
            const move = matchLevelMove[2]
            for(let i = 0; i < speciesArray.length; i++){
                species[speciesArray[i]]["levelUpLearnsets"].push([move, level])
            }
        }
    })
    return species
}










function regexTMHMLearnsets(textTMHMLearnsets, species){
    const lines = textTMHMLearnsets.split("\n")
    let name = null

    lines.forEach(line => {
        const matchSpecies = line.match(/SPECIES_\w+/i)
        if(matchSpecies !== null){
            name = matchSpecies[0]
        }


        const matchTmhmMove = line.match(/TMHM\d* *\((\w+ *\d+) *_ *(\w+)/i)
        if(matchTmhmMove !== null && name in species){
            const TMHM = matchTmhmMove[1]
            let move = matchTmhmMove[2]
            if(move === "SOLARBEAM")
                move = "SOLAR_BEAM" // Fuck Oldplayer :)
            move = `MOVE_${move}`

            species[name]["TMHMLearnsets"].push([move, TMHM])
        }
    })

    return altFormsLearnsets(species, "forms", "TMHMLearnsets")
}









function regexEvolution(textEvolution, species){
    const lines = textEvolution.split("\n")
    let name

    lines.forEach(line =>{

        const matchSpecies = line.match(/\[ *(SPECIES_\w+) *\]/i)
        if(matchSpecies !== null)
            name = matchSpecies[1]



        const matchEvoInfo = line.match(/(\w+), *(\w+), *(\w+)/)
        if(matchEvoInfo !== null){
            const method = matchEvoInfo[1]
            const condition = matchEvoInfo[2]
            const targetSpecies = matchEvoInfo[3]
            species[name]["evolution"].push([method, condition, targetSpecies])
        }
    })


    return getEvolutionLine(species)
}

function getEvolutionLine(species){
    for(let i = 0; i < 2; i++) // FUTURE ME DO NOT DARE QUESTION ME
    {
        for (const name of Object.keys(species)){

            for (let j = 0; j < species[name]["evolution"].length; j++){

                const targetSpecies = species[name]["evolution"][j][2]
                species[name]["evolutionLine"].push(targetSpecies)
            }



            for (let j = 0; j < species[name]["evolution"].length; j++){

                const targetSpecies = species[name]["evolution"][j][2]
                species[targetSpecies]["evolutionLine"] = species[name]["evolutionLine"]
            }
        }
    }

    for (const name of Object.keys(species))
        species[name]["evolutionLine"] = Array.from(new Set(species[name]["evolutionLine"])) // remove duplicates


    return species
}









function regexForms(textForms, species){
    const lines = textForms.split("\n")
    let speciesArray = []

    lines.forEach(line => {
        const matchSpecies = line.match(/SPECIES_\w+/i)
        
        if(/FORM_SPECIES_END/i.test(line)){
            for (let i = 0; i < speciesArray.length; i++)
                species[speciesArray[i]]["forms"] = speciesArray
            speciesArray = []
        }
        else if(matchSpecies !== null){
            const name = matchSpecies[0]
            speciesArray.push(name)
        }
    })
    return species
}








function regexEggMovesLearnsets(textEggMoves, species){
    const lines = textEggMoves.split("\n")
    const speciesString = JSON.stringify(Object.keys(species))
    let name = null

    lines.forEach(line => {
        if(/egg_moves/i.test(line))
            name = null
        const matchMove = line.match(/MOVE_\w+/i)
        if(matchMove !== null){
            const move = matchMove[0]
            if(name !== null)
                species[name]["eggMovesLearnsets"].push(move)
        }
        else if(name === null){
            const matchLine = line.match(/(\w+),/i)
            if(matchLine !== null){
                const testSpecies = `SPECIES_${speciesString.match(matchLine[1])}`
                if(speciesString.includes(testSpecies))
                    name = testSpecies
            }
        }
    })


    return altFormsLearnsets(species, "evolutionLine", "eggMovesLearnsets")
}









function getSpriteConversionTable(textFrontPicTable, species){
    const lines = textFrontPicTable.split("\n")
    const speciesString = JSON.stringify(Object.keys(species))
    let conversionTable = {}

    lines.forEach(line => {

        const matchConversionSpecies = line.match(/(\w+) *, *(gMonFrontPic_\w+)/i)
        if(matchConversionSpecies != null){

            const testSpecies = `SPECIES_${matchConversionSpecies[1]}`
            if(speciesString.includes(testSpecies)){
                const species = testSpecies
                const index = matchConversionSpecies[2]

                if(conversionTable[index] === undefined) // DO NOT TOUCH THAT FUTURE ME, THIS IS THE WAY, DON'T QUESTION ME
                    conversionTable[index] = [species]
                else // DO NOT TOUCH THAT FUTURE ME, THIS IS THE WAY, DON'T QUESTION ME
                    conversionTable[index].push(species)
            }
        }
    })
    return conversionTable
}

function regexSprite(textSprite, conversionTable, species){
    const lines = textSprite.split("\n")
    const conversionTableString = JSON.stringify(Object.keys(conversionTable))

    lines.forEach(line => {
        const matchgMonFrontPic = line.match(/gMonFrontPic_\w+/i)
        if(matchgMonFrontPic !== null){

            const conversion = matchgMonFrontPic[0]
            if(conversionTableString.includes(conversion)){
                const speciesArray = conversionTable[conversion]

                const matchPath = line.match(/graphics\/pokemon\/(\w+\/\w+\/\w+\/\w+\/\w+|\w+\/\w+\/\w+\/\w+|\w+\/\w+\/\w+|\w+\/\w+|\w+)\//i) // ¯\_(ツ)_/¯
                if(matchPath !== null){
                    const path = matchPath[1]
                    const url = `https://raw.githubusercontent.com/${repoDex}/data/species/pokemon/${path}/front.png`
                    for(let i = 0; i < conversionTable[conversion].length; i++){
                        species[speciesArray[i]]["sprite"] = url
                    }
                }
            }
        }
    })
    return species
}











function regexTutorLearnsets(tutorLearnsets, species){
    const lines = tutorLearnsets.split("\n")
    let name = null

    lines.forEach(line => {
        const matchSpecies = line.match(/SPECIES_\w+/i)
        if(matchSpecies !== null){
            name = matchSpecies[0]
        }


        const matchTutorMove = line.match(/TUTOR *\((MOVE_\w+)/i)
        if(matchTutorMove !== null && name in species){
            let move = matchTutorMove[1]

            species[name]["tutorLearnsets"].push(move)
        }
    })

    return altFormsLearnsets(species, "forms", "tutorLearnsets")
}















function altFormsLearnsets(species, input, output){
    for (const name of Object.keys(species)){

        if(species[name][input].length >= 2){

                for (let j = 0; j < species[name][input].length; j++){
                    const targetSpecies = species[name][input][j]
                    

                    if(species[targetSpecies][output].length <= 0){
                        species[targetSpecies][output] = species[name][output]
                    }
                }
        }
    }
    return species
}


function getBST(species){
    for (const name of Object.keys(species)){
        const baseHP = species[name]["baseHP"]
        const baseAttack = species[name]["baseAttack"]
        const baseDefense = species[name]["baseDefense"]
        const baseSpAttack = species[name]["baseSpAttack"]
        const baseSpDefense = species[name]["baseSpDefense"]
        const baseSpeed = species[name]["baseSpeed"]
        const BST = baseHP + baseAttack + baseDefense + baseSpAttack + baseSpDefense + baseSpeed

        species[name]["BST"] = BST

    }
    return species
}