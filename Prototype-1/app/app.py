from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_community.llms.ollama import Ollama
import warnings
from get_embedding_function import get_embedding_function

warnings.filterwarnings("ignore")
CHROMA_PATH = "chroma"

PROMPT_TEMPLATE = """
You are a medical professional. Answer the question based only on the following context like a human would. It should consist of paragraph and conversational aspect rather than just a summary. Answer the asked question briefly, like a human would. Answer in a professional tone:

{context}

---

Answer the question based on the above context: {question}
"""

app = Flask(__name__)
CORS(app)

def query_rag(query_text: str):
    try:
        # Prepare the DB.
        embedding_function = get_embedding_function()
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

        # Search the DB.
        results = db.similarity_search_with_score(query_text, k=5)

        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
        prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context_text, question=query_text)

        model = Ollama(model="llama3")
        response_text = model.invoke(prompt)

        sources = [doc.metadata.get("id", None) for doc, _score in results]
        formatted_response = f"{response_text}\n\n\nSources: {sources}"
        print(formatted_response)
        return formatted_response
    except Exception as e:
        print(f"Error in query_rag: {e}")
        return f"Error processing request: {e}"
    
def query_finetune(prompt: str):
    try:
        prompt = f"<|start_header_id|>system<|end_header_id|> Answer the question truthfully, you are a medical professional.<|eot_id|><|start_header_id|>user<|end_header_id|> This is the question: {prompt}<|eot_id|>"
        model = Ollama(model="medical-llama") # Custom Fine-tuned Model
        response_text = model.invoke(prompt)
        print(response_text)
        return response_text
    except Exception as e:
        print(f"Error in query_rag: {e}")
        return f"Error processing request: {e}"

@app.route('/queryRAG', methods=['POST'])
def queryRAG():
    try:
        data = request.get_json()
        query_text = data.get('query_text')
        if not query_text:
            return jsonify({"error": "No query_text provided"}), 400
        
        print(f"Received query: {query_text}")
        response_text = query_rag(query_text)
        return jsonify({"response": response_text})
    except Exception as e:
        print(f"Error in /query endpoint: {e}")
        return jsonify({"error": f"Error processing request: {e}"}), 500
    
@app.route('/queryFineTune', methods=['POST'])
def queryFinetune():
    try:
        data = request.get_json()
        query_text = data.get('query_text')
        if not query_text:
            return jsonify({"error": "No query_text provided"}), 400
        
        print(f"Received query: {query_text}")
        response_text = query_finetune(query_text)
        return jsonify({"response": response_text})
    except Exception as e:
        print(f"Error in /query endpoint: {e}")
        return jsonify({"error": f"Error processing request: {e}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
