import ForgeUI, {
  render,
  Text,
  ContentAction,
  ModalDialog,
  useState,
  useProductContext,
  useAction,
  Fragment,
} from "@forge/ui";

import Filter from "bad-words";
import api from "@forge/api";

const get_content = async (contentId) => {
  const response = await api
    .asApp()
    .requestConfluence(
      `/wiki/rest/api/content/${contentId}?expand=body.atlas_doc_format`
    );

  if (!response.ok) {
    const err = `Error while get_content with contentId ${contentId}: ${response.status} ${response.statusText}`;
    console.error(err);
    throw new Error(err);
  }
  return await response.json();
};

function get_values(obj, key) {
  var objects = [];
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] == "object") {
      objects = objects.concat(get_values(obj[i], key));
    } else if (i == key) {
      objects.push(obj[i]);
    }
  }
  return objects;
}

const App = () => {
  const [isOpen, setOpen] = useState(true);
  const { contentId } = useProductContext();
  const [data] = useAction(
    () => null,
    async () => await get_content(contentId)
  );

  if (!isOpen) {
    return null;
  }
  const filter = new Filter({ placeHolder: "^" });
  var jsonObj = JSON.parse(data.body.atlas_doc_format.value);
  var text = get_values(jsonObj, "text").join(" ");

  var pattern = /(\^)+/gim;
  var match = "";
  var profaneWords = [];
  while ((match = pattern.exec(filter.clean(text)))) {
    profaneWords.push(text.slice(match.index, pattern.lastIndex));
  }

  return (
    <ModalDialog header="Profanity Checker" onClose={() => setOpen(false)}>
      <Fragment>
        <Text>
          {!filter.isProfane(text)
            ? `No Profane Language used`
            : `Profane Language used. Check the following ${
                profaneWords.length > 1
                  ? `${profaneWords.length} words`
                  : `word`
              } for profanity:`}
        </Text>
        <Text>
          {filter.isProfane(text) ? `**${profaneWords.join(" ")}**` : ""}
        </Text>
      </Fragment>
    </ModalDialog>
  );
};

export const run = render(
  <ContentAction>
    <App />
  </ContentAction>
);
