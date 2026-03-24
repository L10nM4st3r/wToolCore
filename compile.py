import rjsmin

# Helper functions
def get_dependancies(script):
    script = script.replace(" ", "")

    if not "//Dependancies:" in script:
        return []

    for line in script.split("\n"):
        if line.startswith("//Dependancies:"):
            line = line.replace("//Dependancies:", "")

            return line.split(",")
    return []



# Get main script
full_script = ""
added_dependancies = []
needed_dependancies = ["main.js"]
IMPORT_LOCATION_TOKEN = "////// +++++++ IMPORT SCRIPTS HERE +++++++ //////"

while len(needed_dependancies) > 0:
    script = ""
    file = needed_dependancies.pop(0)

    if not file in added_dependancies:
        with open(file, 'r') as file_content:
            script = "\n".join(file_content.readlines(0))
        
        dependancies = get_dependancies(script)
        has_all_dependancies = True

        # Process all dependancies
        for i in dependancies:
            if not i in added_dependancies:
                has_all_dependancies = False
                needed_dependancies.append(i)
            elif not i in needed_dependancies:
                needed_dependancies.append(i)

        if file == "main.js":
            full_script += script
            continue

        # Add to the script if all dpendancies are present
        if has_all_dependancies:
            added_dependancies.append(file)
            if IMPORT_LOCATION_TOKEN in full_script:
                full_script = full_script.replace(IMPORT_LOCATION_TOKEN,  "\n" + script + IMPORT_LOCATION_TOKEN)
            else:
                full_script += script
        else:
            needed_dependancies.append(file)
        
        


with open("compiled_script_raw.js", 'w') as file:
    file.write("//<nowiki>\n\n" + full_script + "\n\n//</nowiki>")

with open("compiled_script.js", 'w') as file:
    file.write("//<nowiki>\n\n" + rjsmin.jsmin(full_script) + "\n\n//</nowiki>")


#with open("compiled_script.js", 'w') as file:
#    file.write(full_script)