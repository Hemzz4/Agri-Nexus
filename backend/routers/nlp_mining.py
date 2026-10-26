from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import os
import re
import pandas as pd
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import nltk
from nltk.tokenize import sent_tokenize
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
except Exception:
    pass # Fallback to naive splitting


router = APIRouter(
    prefix="/api/nlp",
    tags=["Text Mining"]
)

# Pydantic models for request bodies
class QueryRequest(BaseModel):
    text: str

class NewsRequest(BaseModel):
    text: str

# Paths to models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADVISORY_MODEL_PATH = os.path.join(BASE_DIR, "ml", "nlp_advisory_model.joblib")
SENTIMENT_MODEL_PATH = os.path.join(BASE_DIR, "ml", "nlp_sentiment_model.joblib")

# Global variables for models (loaded lazily)
advisory_model = None
sentiment_model = None

def load_advisory_model():
    global advisory_model
    if advisory_model is None:
        if os.path.exists(ADVISORY_MODEL_PATH):
            advisory_model = joblib.load(ADVISORY_MODEL_PATH)
        else:
            raise FileNotFoundError(f"Model not found at {ADVISORY_MODEL_PATH}")
    return advisory_model

def load_sentiment_model(force_reload: bool = False):
    global sentiment_model
    if sentiment_model is None or force_reload:
        if os.path.exists(SENTIMENT_MODEL_PATH):
            sentiment_model = joblib.load(SENTIMENT_MODEL_PATH)
        else:
            raise FileNotFoundError(f"Model not found at {SENTIMENT_MODEL_PATH}")
    return sentiment_model


@router.post("/advisory")
async def predict_advisory(request: QueryRequest):
    """
    Predicts the category of a farmer's query using a Text Mining (TF-IDF + Naive Bayes) pipeline.
    """
    try:
        model = load_advisory_model()
        prediction = model.predict([request.text])[0]
        
        # Simple rule-based action generator for demo purposes
        action_map = {
            "Disease": "Consult a local agronomist and consider appropriate fungicides.",
            "Nutrient": "Consider soil testing and amend with recommended NPK ratio.",
            "Pest": "Identify pest type and apply targeted biological controls or pesticides.",
            "Equipment": "Check machinery manuals or consult a local mechanic for repairs.",
            "Market": "Monitor local mandis and government portals for the best selling prices.",
            "Water": "Optimize irrigation schedules based on soil moisture levels.",
            "Weather": "Check IMD reports for upcoming weather forecasts and plan accordingly."
        }
        action = action_map.get(prediction, "Contact local agricultural extension office.")
        
        # Keyword/Entity Extraction
        query_lower = request.text.lower()
        known_crops = ["tomato", "wheat", "cotton", "rice", "corn", "potato", "soybean", "onion", "tea", "sugarcane", "maize"]
        known_threats = ["insects", "mildew", "fungal", "disease", "dry", "broken", "aphids", "caterpillars", "whiteflies", "drought", "rot", "spots"]
        
        extracted_crops = [crop for crop in known_crops if re.search(rf"\b{crop}\b", query_lower)]
        extracted_threats = [threat for threat in known_threats if re.search(rf"\b{threat}\b", query_lower)]
        
        entities = []
        if extracted_crops:
            entities.append({"type": "Crop", "value": extracted_crops[0].capitalize()})
        if extracted_threats:
            entities.append({"type": "Threat", "value": extracted_threats[0].capitalize()})
        
        return {
            "query": request.text,
            "predicted_category": prediction,
            "recommended_action": action,
            "entities": entities
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


POSITIVE_KEYWORDS = {
    'boost', 'boosts', 'boosted', 'booming', 'boom', 'increase', 'increases', 'increased',
    'surplus', 'record', 'bumper', 'subsidies', 'subsidy', 'relief', 'gain', 'gains',
    'profits', 'profit', 'profitable', 'lucrative', 'surge', 'surges', 'surging', 'prosper',
    'prosperity', 'growth', 'grow', 'rebound', 'rebounds', 'incentive', 'incentives',
    'stabilize', 'stabilizes', 'stabilized', 'support', 'favorable', 'optimism', 'optimistic',
    'benefit', 'benefits', 'celebrate', 'celebrates', 'celebrating', 'innovative', 'advance',
    'high', 'rise', 'rises', 'rising', 'bountiful', 'prosperous', 'thrive', 'thriving', 'payout',
    'payouts', 'healthy', 'flourish'
}

NEGATIVE_KEYWORDS = {
    'drought', 'locust', 'swarm', 'pest', 'disease', 'blight', 'rot', 'rots', 'rotting',
    'destroy', 'destroys', 'destroyed', 'destruction', 'loss', 'losses', 'crash', 'crashes',
    'crashed', 'protest', 'protests', 'damage', 'damages', 'damaged', 'slump', 'slumps',
    'plunge', 'plunges', 'crisis', 'deficit', 'disaster', 'disastrous', 'ruin', 'ruins',
    'ruined', 'distress', 'failure', 'fail', 'fails', 'failed', 'threat', 'threatens',
    'threatened', 'storm', 'hail', 'hailstorm', 'devastate', 'devastates', 'devastated',
    'shortage', 'shortages', 'heatwave', 'flood', 'floods', 'scorch', 'scorched', 'submerge',
    'submerged', 'scarcity', 'decline', 'declines', 'declined'
}


@router.post("/sentiment")
async def predict_sentiment(request: NewsRequest):
    """
    Predicts the sentiment of an agricultural news snippet using TF-IDF + Classifier with domain reinforcement.
    """
    try:
        model = load_sentiment_model()
        prediction = model.predict([request.text])[0]
        
        # Domain-aware agro-sentiment validation
        clean_words = set(re.findall(r'\b[a-z]+\b', request.text.lower()))
        pos_count = len(clean_words & POSITIVE_KEYWORDS)
        neg_count = len(clean_words & NEGATIVE_KEYWORDS)
        
        if pos_count > neg_count and pos_count >= 1:
            prediction = "Positive"
        elif neg_count > pos_count and neg_count >= 1:
            prediction = "Negative"
        
        return {
            "news_text": request.text,
            "predicted_sentiment": prediction
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/analytics")
async def get_analytics():
    """
    Returns text mining analytics from the datasets for the dashboard.
    """
    try:
        advisory_path = os.path.join(BASE_DIR, "data", "farmer_queries.csv")
        news_path = os.path.join(BASE_DIR, "data", "agri_news.csv")
        
        # Word Frequencies for Word Cloud
        words = []
        if os.path.exists(advisory_path):
            df_adv = pd.read_csv(advisory_path)
            # Combine all queries
            text = " ".join(df_adv['query'].dropna().tolist()).lower()
            # Remove punctuation and split
            words_raw = re.findall(r'\b[a-z]{3,}\b', text)
            
            # Simple stopword list
            stopwords = {"the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "has", "my", "is", "of", "to", "in", "on", "with", "what", "how", "do", "i", "a", "how", "is", "it", "this", "that", "there", "will", "be"}
            words_filtered = [w for w in words_raw if w not in stopwords]
            
            # Get top 30 words
            word_counts = Counter(words_filtered).most_common(30)
            words = [{"text": w[0], "value": w[1]} for w in word_counts]
            
        # Sentiment Distribution for Pie Chart
        sentiments = []
        if os.path.exists(news_path):
            df_news = pd.read_csv(news_path)
            sent_counts = df_news['sentiment'].value_counts().to_dict()
            sentiments = [{"name": k, "value": v} for k, v in sent_counts.items()]
            
        return {
            "word_cloud": words,
            "sentiment_distribution": sentiments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

# --- NEW TEXT MINING FEATURES ---

class DocumentRequest(BaseModel):
    text: str
    num_sentences: int = 3

class DocumentsRequest(BaseModel):
    documents: list[str]
    num_topics: int = 3

@router.post("/topic-modeling")
async def extract_topics(request: DocumentsRequest):
    """
    Topic Modeling (LDA): Discovers underlying topics from a list of documents/queries.
    """
    try:
        if not request.documents or len(request.documents) < 2:
            raise HTTPException(status_code=400, detail="Provide at least 2 documents for topic modeling.")
            
        vectorizer = CountVectorizer(stop_words='english', max_df=0.95, min_df=1)
        doc_term_matrix = vectorizer.fit_transform(request.documents)
        
        lda_model = LatentDirichletAllocation(n_components=min(request.num_topics, len(request.documents)), random_state=42)
        lda_model.fit(doc_term_matrix)
        
        feature_names = vectorizer.get_feature_names_out()
        topics = {}
        for topic_idx, topic in enumerate(lda_model.components_):
            top_words = [feature_names[i] for i in topic.argsort()[:-6:-1]] # Top 5 words
            topics[f"Topic {topic_idx + 1}"] = top_words
            
        return {"topics": topics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topic Modeling error: {str(e)}")

@router.post("/summarize")
async def summarize_text(request: DocumentRequest):
    """
    Text Summarization: Extractive summarization using TF-IDF and sentence scoring.
    """
    try:
        # Fallback naive sent_tokenize if nltk fails
        try:
            sentences = sent_tokenize(request.text)
        except Exception:
            sentences = re.split(r'(?<=[.!?]) +', request.text)
            
        if len(sentences) <= request.num_sentences:
            return {"summary": request.text, "sentences_reduced": 0}
            
        # Calculate TF-IDF
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(sentences)
        
        # Score sentences based on sum of TF-IDF values
        sentence_scores = np.array(tfidf_matrix.sum(axis=1)).flatten()
        
        # Get top N sentences, keeping original order
        top_sentence_indices = sentence_scores.argsort()[-request.num_sentences:][::-1]
        top_sentence_indices.sort()
        
        summary = " ".join([sentences[i] for i in top_sentence_indices])
        
        return {
            "summary": summary,
            "original_sentences_count": len(sentences),
            "summary_sentences_count": request.num_sentences
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization error: {str(e)}")

@router.post("/similar-queries")
async def similar_queries(request: QueryRequest):
    """
    Similar Query Search: Uses TF-IDF and Cosine Similarity to find similar past queries.
    """
    try:
        advisory_path = os.path.join(BASE_DIR, "data", "farmer_queries.csv")
        past_queries = []
        if os.path.exists(advisory_path):
            df_adv = pd.read_csv(advisory_path)
            past_queries = df_adv['query'].dropna().unique().tolist()
        
        if not past_queries:
            # Dummy data if CSV is empty/missing
            past_queries = [
                "How to treat whiteflies in tomato plants?",
                "What is the best fertilizer for wheat?",
                "My cotton leaves are turning yellow, what should I do?",
                "Irrigation schedule for rice in summer.",
                "How to cure leaf spots in tomatoes?"
            ]
            
        documents = [request.text] + past_queries
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(documents)
        
        # Calculate cosine similarity between the query (index 0) and all past queries
        cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        # Get top 3 most similar queries
        related_docs_indices = cosine_similarities.argsort()[:-4:-1]
        
        results = []
        for idx in related_docs_indices:
            if cosine_similarities[idx] > 0.1: # Only include if similarity > 10%
                results.append({
                    "query": past_queries[idx],
                    "similarity_score": round(cosine_similarities[idx] * 100, 2)
                })
                
        return {"similar_queries": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similar Query Search error: {str(e)}")

@router.post("/ner")
async def extract_entities(request: DocumentRequest):
    """
    Advanced Keyword & Entity Extraction (NER): Rule-based extraction using expanded dictionaries.
    """
    try:
        text = request.text.lower()
        
        # Dictionaries
        crops = {"tomato", "wheat", "cotton", "rice", "corn", "potato", "soybean", "onion", "tea", "sugarcane", "maize", "apple", "banana", "mango", "grape"}
        diseases = {"blight", "rust", "mildew", "rot", "wilt", "leaf spot", "mosaic", "scab", "canker", "smut"}
        pests = {"aphid", "caterpillar", "whitefly", "borer", "weevil", "mite", "thrip", "locust", "beetle", "worm", "insect"}
        treatments = {"npk", "urea", "fungicide", "pesticide", "herbicide", "insecticide", "neem oil", "compost", "manure", "fertilizer"}
        weather_terms = {"drought", "rain", "flood", "frost", "heat", "humidity", "monsoon", "winter", "summer"}
        
        def extract(entity_set):
            found = []
            for item in entity_set:
                # Use regex to find whole words only
                if re.search(rf"\b{item}s?\b", text): # Plural support simple
                    found.append(item.capitalize())
            return found
            
        entities = {
            "Crops": extract(crops),
            "Diseases": extract(diseases),
            "Pests": extract(pests),
            "Treatments": extract(treatments),
            "Weather_Conditions": extract(weather_terms)
        }
        
        # Remove empty categories
        entities = {k: v for k, v in entities.items() if v}
        
        return {"entities": entities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NER error: {str(e)}")


class ClusterRequest(BaseModel):
    documents: list[str]
    num_clusters: int = 2

@router.post("/ngrams")
async def extract_ngrams(request: DocumentsRequest):
    """
    N-gram Extraction: Extracts the most frequent bigrams/trigrams from a set of documents.
    """
    try:
        if not request.documents:
            raise HTTPException(status_code=400, detail="Provide at least 1 document.")
            
        # We can default to bigrams and trigrams (2, 3)
        vectorizer = CountVectorizer(ngram_range=(2, 3), stop_words='english', max_features=10)
        X = vectorizer.fit_transform(request.documents)
        
        sum_words = np.array(X.sum(axis=0)).flatten()
        words_freq = [(word, int(sum_words[idx])) for word, idx in vectorizer.vocabulary_.items()]
        words_freq = sorted(words_freq, key=lambda x: x[1], reverse=True)
        
        return {"top_ngrams": [{"ngram": word, "frequency": freq} for word, freq in words_freq]}
    except ValueError:
        # Happens if documents are empty or contain only stop words
        return {"top_ngrams": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"N-gram extraction error: {str(e)}")

@router.post("/clustering")
async def cluster_documents(request: ClusterRequest):
    """
    Text Clustering (K-Means): Groups similar documents into clusters using TF-IDF.
    """
    try:
        if not request.documents or len(request.documents) < request.num_clusters:
            raise HTTPException(status_code=400, detail="Provide more documents than the number of clusters.")
            
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(request.documents)
        
        kmeans = KMeans(n_clusters=request.num_clusters, random_state=42, n_init=10)
        kmeans.fit(tfidf_matrix)
        
        # Group documents by cluster
        clusters = {f"Cluster {i+1}": [] for i in range(request.num_clusters)}
        for doc, label in zip(request.documents, kmeans.labels_):
            clusters[f"Cluster {label+1}"].append(doc)
            
        # Extract top terms per cluster
        order_centroids = kmeans.cluster_centers_.argsort()[:, ::-1]
        terms = vectorizer.get_feature_names_out()
        
        cluster_keywords = {}
        for i in range(request.num_clusters):
            top_terms = [terms[ind] for ind in order_centroids[i, :5]] # top 5 terms
            cluster_keywords[f"Cluster {i+1}"] = top_terms
            
        return {
            "clusters": clusters,
            "cluster_keywords": cluster_keywords
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering error: {str(e)}")

@router.post("/lexical-analysis")
async def analyze_text(request: DocumentRequest):
    """
    Lexical Analysis: Computes text statistics like Type-Token Ratio (TTR) and word counts.
    """
    try:
        text = request.text
        # Basic tokenization using regex to avoid nltk dependencies issue
        words = re.findall(r'\b\w+\b', text.lower())
        
        if not words:
            return {"error": "No words found in text."}
            
        word_count = len(words)
        unique_words = set(words)
        vocab_size = len(unique_words)
        
        # Type-Token Ratio (lexical richness)
        ttr = vocab_size / word_count if word_count > 0 else 0
        
        # Sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s for s in sentences if s.strip()]
        sentence_count = len(sentences) if sentences else 1
        
        avg_words_per_sentence = word_count / sentence_count
        avg_word_length = sum(len(word) for word in words) / word_count
        
        return {
            "word_count": word_count,
            "vocabulary_size": vocab_size,
            "type_token_ratio": round(ttr, 4),
            "sentence_count": sentence_count,
            "avg_words_per_sentence": round(avg_words_per_sentence, 2),
            "avg_word_length": round(avg_word_length, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lexical Analysis error: {str(e)}")


# ==============================================================================
# PEST & CROP EXTRACTOR FEATURE
# ==============================================================================

class PestCropRequest(BaseModel):
    text: str

# Comprehensive Agricultural Crop Database
CROP_DATABASE = {
    "rice": {"name": "Rice (Paddy)", "scientific": "Oryza sativa", "category": "Cereals", "aliases": ["rice", "paddy", "samba", "kuruvai", "thaladi", "basmati", "dhan"]},
    "wheat": {"name": "Wheat", "scientific": "Triticum aestivum", "category": "Cereals", "aliases": ["wheat", "gehun"]},
    "maize": {"name": "Maize (Corn)", "scientific": "Zea mays", "category": "Cereals", "aliases": ["maize", "corn", "sweet corn", "makka"]},
    "cotton": {"name": "Cotton", "scientific": "Gossypium hirsutum", "category": "Fibre / Cash Crop", "aliases": ["cotton", "kapas"]},
    "sugarcane": {"name": "Sugarcane", "scientific": "Saccharum officinarum", "category": "Commercial Crop", "aliases": ["sugarcane", "cane", "karumbu", "ganna"]},
    "tomato": {"name": "Tomato", "scientific": "Solanum lycopersicum", "category": "Vegetables", "aliases": ["tomato", "tomatoes", "thakkali"]},
    "potato": {"name": "Potato", "scientific": "Solanum tuberosum", "category": "Tuber Vegetables", "aliases": ["potato", "potatoes", "aloo"]},
    "onion": {"name": "Onion", "scientific": "Allium cepa", "category": "Bulb Vegetables", "aliases": ["onion", "onions", "shallot", "shallots", "vengayam", "pyaz"]},
    "chilli": {"name": "Chilli", "scientific": "Capsicum annuum", "category": "Spices & Vegetables", "aliases": ["chilli", "chillies", "chili", "chilies", "pepper", "peppers", "milagai", "mirch"]},
    "groundnut": {"name": "Groundnut (Peanut)", "scientific": "Arachis hypogaea", "category": "Oilseeds & Legumes", "aliases": ["groundnut", "groundnuts", "peanut", "peanuts", "kadalai", "moongphali"]},
    "soybean": {"name": "Soybean", "scientific": "Glycine max", "category": "Oilseeds & Legumes", "aliases": ["soybean", "soybeans", "soya"]},
    "banana": {"name": "Banana", "scientific": "Musa acuminata", "category": "Fruits", "aliases": ["banana", "bananas", "plantain", "plantains", "vazhai", "kela"]},
    "mango": {"name": "Mango", "scientific": "Mangifera indica", "category": "Fruits", "aliases": ["mango", "mangoes", "manga", "aam"]},
    "turmeric": {"name": "Turmeric", "scientific": "Curcuma longa", "category": "Spices & Medicinal", "aliases": ["turmeric", "manjal", "haldi"]},
    "tea": {"name": "Tea", "scientific": "Camellia sinensis", "category": "Plantation Crops", "aliases": ["tea", "chai"]},
    "coffee": {"name": "Coffee", "scientific": "Coffea arabica", "category": "Plantation Crops", "aliases": ["coffee"]},
    "coconut": {"name": "Coconut", "scientific": "Cocos nucifera", "category": "Plantation Crops", "aliases": ["coconut", "coconuts", "thengai", "nariyal"]},
    "brinjal": {"name": "Brinjal (Eggplant)", "scientific": "Solanum melongena", "category": "Vegetables", "aliases": ["brinjal", "eggplant", "aubergine", "kathirikai", "baingan"]},
    "okra": {"name": "Okra (Bhendi)", "scientific": "Abelmoschus esculentus", "category": "Vegetables", "aliases": ["okra", "bhendi", "bhindi", "ladyfinger", "lady's finger", "vendaikkai"]},
    "cabbage": {"name": "Cabbage", "scientific": "Brassica oleracea var. capitata", "category": "Cole Vegetables", "aliases": ["cabbage", "muttakose", "patta gobhi"]},
    "cauliflower": {"name": "Cauliflower", "scientific": "Brassica oleracea var. botrytis", "category": "Cole Vegetables", "aliases": ["cauliflower", "phool gobhi"]},
    "citrus": {"name": "Citrus (Lemon/Orange)", "scientific": "Citrus spp.", "category": "Fruits", "aliases": ["citrus", "lemon", "lemons", "lime", "orange", "oranges", "mosambi", "elumichai"]},
    "papaya": {"name": "Papaya", "scientific": "Carica papaya", "category": "Fruits", "aliases": ["papaya", "pappali"]},
    "sorghum": {"name": "Sorghum (Jowar)", "scientific": "Sorghum bicolor", "category": "Millets", "aliases": ["sorghum", "jowar", "cholam"]},
    "pearl_millet": {"name": "Pearl Millet (Bajra)", "scientific": "Pennisetum glaucum", "category": "Millets", "aliases": ["pearl millet", "bajra", "kambu"]},
    "finger_millet": {"name": "Finger Millet (Ragi)", "scientific": "Eleusine coracana", "category": "Millets", "aliases": ["finger millet", "ragi", "kezhvaragu"]},
    "pulses": {"name": "Pulses (Legumes)", "scientific": "Fabaceae", "category": "Pulses", "aliases": ["pulse", "pulses", "black gram", "green gram", "red gram", "pigeon pea", "chickpea", "urad", "moong", "toor", "dal"]},
    "mustard": {"name": "Mustard", "scientific": "Brassica nigra", "category": "Oilseeds", "aliases": ["mustard", "sarson", "kadugu"]},
    "cardamom": {"name": "Cardamom", "scientific": "Elettaria cardamomum", "category": "Spices", "aliases": ["cardamom", "elachi", "elakkai"]},
    "ginger": {"name": "Ginger", "scientific": "Zingiber officinale", "category": "Spices", "aliases": ["ginger", "inji", "adrak"]}
}

# Comprehensive Agricultural Pest & Insect Database
PEST_DATABASE = {
    "fall_armyworm": {
        "name": "Fall Armyworm",
        "scientific": "Spodoptera frugiperda",
        "type": "Caterpillar / Lepidoptera",
        "damage": "Voracious feeder damaging central leaf whorls, tassels, and ears",
        "severity": "High",
        "aliases": ["fall armyworm", "armyworm", "armyworms", "spodoptera", "faw"],
        "susceptible_crops": ["maize", "sorghum", "rice", "sugarcane"]
    },
    "bollworm": {
        "name": "Bollworm Complex (American/Pink)",
        "scientific": "Helicoverpa armigera / Pectinophora gossypiella",
        "type": "Lepidopteran Borer",
        "damage": "Bores into flower buds, squares, pods, and bolls causing shedding and rotting",
        "severity": "High",
        "aliases": ["bollworm", "bollworms", "pink bollworm", "american bollworm", "spotted bollworm", "helicoverpa", "gram pod borer"],
        "susceptible_crops": ["cotton", "tomato", "pulses", "chilli"]
    },
    "whitefly": {
        "name": "Whitefly",
        "scientific": "Bemisia tabaci",
        "type": "Sap Sucking Insect",
        "damage": "Sucks cell sap causing chlorosis; transmits Tomato Yellow Leaf Curl and Cotton Leaf Curl viruses; secretes honeydew leading to sooty mold",
        "severity": "High",
        "aliases": ["whitefly", "whiteflies", "bemisia"],
        "susceptible_crops": ["cotton", "tomato", "chilli", "brinjal", "okra", "papaya"]
    },
    "aphids": {
        "name": "Aphids (Green/Black)",
        "scientific": "Aphis gossypii / Myzus persicae",
        "type": "Sap Sucking Hemiptera",
        "damage": "Colonies on tender shoots cause leaf curling, stunting, and sooty mold development",
        "severity": "Moderate",
        "aliases": ["aphid", "aphids", "black aphid", "green aphid", "plant lice"],
        "susceptible_crops": ["cotton", "chilli", "cabbage", "cauliflower", "mustard", "wheat", "pulses"]
    },
    "thrips": {
        "name": "Thrips",
        "scientific": "Scirtothrips dorsalis / Thrips tabaci",
        "type": "Rasping & Sucking Pest",
        "damage": "Lacerates tender leaves causing upward curling ('boat shape'), silvery patches, and bronzing",
        "severity": "High",
        "aliases": ["thrip", "thrips", "chilli thrip", "chilli thrips"],
        "susceptible_crops": ["chilli", "onion", "cotton", "tomato", "groundnut"]
    },
    "stem_borer": {
        "name": "Yellow Stem Borer",
        "scientific": "Scirpophaga incertulas",
        "type": "Lepidopteran Internal Borer",
        "damage": "Larvae bore into main tillers causing 'dead hearts' in vegetative stage and 'white ears' in reproductive stage",
        "severity": "High",
        "aliases": ["stem borer", "stem borers", "yellow stem borer", "paddy borer", "shoot borer"],
        "susceptible_crops": ["rice", "sugarcane", "maize"]
    },
    "brown_planthopper": {
        "name": "Brown Planthopper (BPH)",
        "scientific": "Nilaparvata lugens",
        "type": "Sap Sucking Delphacid",
        "damage": "Nymphs and adults suck phloem sap at the base of tillers causing circular drying patches ('hopper burn')",
        "severity": "Critical",
        "aliases": ["brown planthopper", "planthopper", "planthoppers", "bph", "green leafhopper", "leafhopper"],
        "susceptible_crops": ["rice"]
    },
    "fruit_borer": {
        "name": "Fruit and Shoot Borer",
        "scientific": "Leucinodes orbonalis / Helicoverpa",
        "type": "Internal Fruit Borer",
        "damage": "Caterpillars bore into growing terminal shoots causing drooping, then bore into fruits leaving visible exit holes",
        "severity": "High",
        "aliases": ["fruit borer", "fruit borers", "shoot and fruit borer", "tomato fruit borer", "brinjal borer"],
        "susceptible_crops": ["tomato", "brinjal", "okra", "chilli"]
    },
    "mealybug": {
        "name": "Mealybugs",
        "scientific": "Paracoccus marginatus / Phenacoccus solenopsis",
        "type": "Sap Sucking Coccid",
        "damage": "Clusters of white cottony wax masses suck sap from leaves, stems, and fruits causing crinkling and flower drop",
        "severity": "Moderate",
        "aliases": ["mealybug", "mealybugs", "papaya mealybug", "cotton mealybug"],
        "susceptible_crops": ["cotton", "papaya", "citrus", "tomato", "banana"]
    },
    "spider_mites": {
        "name": "Red Spider Mite / Yellow Mite",
        "scientific": "Tetranychus urticae / Polyphagotarsonemus latus",
        "type": "Acari / Phytophagous Mite",
        "damage": "Mites feed on leaf undersides spinning fine webbing; leaves curl downwards with rough brownish texture",
        "severity": "Moderate",
        "aliases": ["spider mite", "spider mites", "red mite", "yellow mite", "mites", "mite"],
        "susceptible_crops": ["chilli", "tomato", "brinjal", "cotton", "tea"]
    },
    "leaf_miner": {
        "name": "Serpentine Leaf Miner",
        "scientific": "Liriomyza trifolii",
        "type": "Dipteran Maggot",
        "damage": "Larvae mine between leaf epidermal layers creating serpentine whitish trails that reduce photosynthetic area",
        "severity": "Moderate",
        "aliases": ["leaf miner", "leaf miners", "leafminer", "serpentine leaf miner"],
        "susceptible_crops": ["tomato", "cabbage", "cauliflower", "pulses", "cotton"]
    },
    "cutworm": {
        "name": "Cutworms",
        "scientific": "Agrotis ipsilon",
        "type": "Nocturnal Soil Caterpillar",
        "damage": "Cut young seedlings at ground level during night and hide in soil crevices by day",
        "severity": "Moderate",
        "aliases": ["cutworm", "cutworms"],
        "susceptible_crops": ["potato", "tomato", "cabbage", "maize"]
    },
    "locust": {
        "name": "Locust / Grasshopper",
        "scientific": "Schistocerca gregaria / Hieroglyphus banian",
        "type": "Orthopteran Swarm Pest",
        "damage": "Devours all green foliage, leaves, and young stems leaving completely defoliated stalks",
        "severity": "Critical",
        "aliases": ["locust", "locusts", "locust swarm", "grasshopper", "grasshoppers"],
        "susceptible_crops": ["rice", "wheat", "maize", "sugarcane", "cotton"]
    },
    "root_knot_nematode": {
        "name": "Root Knot Nematode",
        "scientific": "Meloidogyne incognita",
        "type": "Plant Parasitic Nematode",
        "damage": "Produces distinct galls/knots on root systems impeding water and nutrient uptake, causing yellowing and stunting",
        "severity": "High",
        "aliases": ["nematode", "nematodes", "root knot nematode", "root knot"],
        "susceptible_crops": ["tomato", "brinjal", "banana", "chilli", "potato"]
    },
    "weevil": {
        "name": "Weevils (Rice/Grain/Root)",
        "scientific": "Sitophilus oryzae / Cylas formicarius",
        "type": "Coleopteran Weevil",
        "damage": "Adults and grubs bore into grain kernels, sweet potato tubers, or roots",
        "severity": "Moderate",
        "aliases": ["weevil", "weevils", "rice weevil", "sweet potato weevil"],
        "susceptible_crops": ["rice", "wheat", "maize", "potato"]
    },
    "termites": {
        "name": "Termites (White Ants)",
        "scientific": "Odontotermes obesus",
        "type": "Isopteran Subterranean Pest",
        "damage": "Feed on root systems and germinating setts/seeds causing sudden wilting and lodging",
        "severity": "Moderate",
        "aliases": ["termite", "termites", "white ant", "white ants"],
        "susceptible_crops": ["sugarcane", "wheat", "groundnut", "maize"]
    }
}

# Agricultural Diseases & Pathogens
DISEASE_DATABASE = {
    "blast": {"name": "Blast Disease", "scientific": "Magnaporthe oryzae", "type": "Fungal", "aliases": ["blast", "paddy blast", "neck blast", "leaf blast"]},
    "blight": {"name": "Blight (Late / Early / Bacterial)", "scientific": "Phytophthora / Alternaria / Xanthomonas", "type": "Fungal / Bacterial", "aliases": ["blight", "late blight", "early blight", "bacterial blight"]},
    "rust": {"name": "Rust (Yellow / Brown / Black)", "scientific": "Puccinia spp.", "type": "Fungal", "aliases": ["rust", "brown rust", "yellow rust", "black rust"]},
    "mildew": {"name": "Mildew (Powdery / Downy)", "scientific": "Erysiphe / Peronospora", "type": "Fungal", "aliases": ["mildew", "powdery mildew", "downy mildew"]},
    "leaf_curl": {"name": "Leaf Curl Virus", "scientific": "Begomovirus (TYLCV)", "type": "Viral (Vector-borne)", "aliases": ["leaf curl", "yellow leaf curl", "curl virus"]},
    "red_rot": {"name": "Red Rot", "scientific": "Colletotrichum falcatum", "type": "Fungal", "aliases": ["red rot", "sugarcane red rot"]},
    "wilt": {"name": "Wilt (Fusarium / Bacterial)", "scientific": "Fusarium oxysporum / Ralstonia", "type": "Fungal / Bacterial", "aliases": ["wilt", "fusarium wilt", "bacterial wilt"]},
    "leaf_spot": {"name": "Leaf Spot / Tikka", "scientific": "Cercospora / Septoria", "type": "Fungal", "aliases": ["leaf spot", "leaf spots", "tikka disease", "tikka"]},
    "mosaic": {"name": "Mosaic Virus", "scientific": "Mosaic virus (TMV/CMV)", "type": "Viral", "aliases": ["mosaic", "mosaic virus", "yellow mosaic"]},
    "anthracnose": {"name": "Anthracnose / Dieback", "scientific": "Colletotrichum gloeosporioides", "type": "Fungal", "aliases": ["anthracnose", "dieback", "die back"]},
    "rot": {"name": "Root / Collar Rot", "scientific": "Rhizoctonia / Pythium", "type": "Fungal", "aliases": ["rot", "root rot", "collar rot", "stem rot", "fruit rot"]},
    "canker": {"name": "Bacterial Canker", "scientific": "Xanthomonas axonopodis", "type": "Bacterial", "aliases": ["canker", "citrus canker"]}
}

# Symptom & Damage Indicators
SYMPTOM_DATABASE = [
    {"name": "Leaf Yellowing / Chlorosis", "aliases": ["yellowing", "yellow leaves", "chlorosis", "yellow spots", "yellow veins", "paling"]},
    {"name": "Leaf Curling / Distortion", "aliases": ["curling", "curled leaves", "leaf curl", "boat shaped leaves", "distortion", "crinkling"]},
    {"name": "Wilting / Drooping", "aliases": ["wilting", "drooping", "wilt", "drying", "drying up", "withered", "withering"]},
    {"name": "Stunted Growth", "aliases": ["stunting", "stunted growth", "dwarf", "stunted"]},
    {"name": "Holes / Foliage Defoliation", "aliases": ["holes", "hole in leaves", "chewed leaves", "defoliation", "eaten leaves", "leaf holes", "perforated"]},
    {"name": "Dead Hearts / White Ears", "aliases": ["dead heart", "dead hearts", "white ear", "white ears", "drying tillers"]},
    {"name": "Honeydew & Sooty Mold", "aliases": ["honeydew", "sooty mold", "black mold", "sticky leaves", "sticky secretion"]},
    {"name": "Lesions / Necrotic Spots", "aliases": ["lesions", "necrotic spots", "brown spots", "black spots", "pustules", "water soaked"]},
    {"name": "Internal Boring / Frass", "aliases": ["boring", "bore holes", "frass", "caterpillar droppings", "tunneling", "stem tunnel"]},
    {"name": "Webbing Under Leaves", "aliases": ["webbing", "fine web", "spider web", "silken webs"]}
]

def generate_ipm_recommendations(extracted_crops, extracted_pests, extracted_diseases):
    """
    Generates actionable Integrated Pest Management (IPM) recommendations
    tailored to the specific crops, pests, and diseases extracted from text.
    """
    recs = []
    pest_keys = {p["key"] for p in extracted_pests}
    crop_keys = {c["key"] for c in extracted_crops}
    disease_keys = {d["key"] for d in extracted_diseases}
    
    # 1. Fall Armyworm on Maize/Cereals
    if "fall_armyworm" in pest_keys:
        recs.append({
            "target": "Fall Armyworm (Spodoptera frugiperda)",
            "threat_level": "High",
            "cultural": "Erect 5 sex pheromone traps per acre for pest population monitoring. Deep summer ploughing to expose pupae to predatory birds.",
            "biological": "Release egg parasitoids Trichogramma pretiosum @ 50,000/acre. Spray entomopathogenic fungus Beauveria bassiana or Metarhizium anisopliae (1x10^8 CFU/g) @ 5g/L of water.",
            "botanical": "Foliar application of Azadirachtin 1500 ppm (Neem oil formulation) @ 3-5 ml/L at initial whorl damage stage.",
            "chemical": "If >10% whorl damage persists, apply targeted sprays into the whorl: Emamectin Benzoate 5% SG @ 0.4 g/L or Chlorantraniliprole 18.5% SC @ 0.3 ml/L."
        })
        
    # 2. Whitefly & Leaf Curl Virus
    if "whitefly" in pest_keys or "leaf_curl" in disease_keys:
        recs.append({
            "target": "Whitefly & Leaf Curl Virus Complex",
            "threat_level": "High",
            "cultural": "Install bright yellow sticky traps (15-20 traps/acre) placed 15 cm above crop canopy. Avoid excessive nitrogen fertilizer.",
            "biological": "Conserve natural predators such as ladybird beetles (Coccinella) and lacewings (Chrysoperla carnea). Spray Verticillium lecanii @ 5g/L.",
            "botanical": "Spray Neem Seed Kernel Extract (NSKE 5%) or 3% Neem oil with 1 ml soap solution per liter.",
            "chemical": "Judicious spray of Spiromesifen 22.9% SC @ 1.25 ml/L or Acetamiprid 20% SP @ 0.3 g/L during early morning or late evening."
        })

    # 3. Bollworm Complex (Cotton / Tomato / Gram)
    if "bollworm" in pest_keys:
        recs.append({
            "target": "Bollworm & Pod Borer Complex (Helicoverpa)",
            "threat_level": "High",
            "cultural": "Install yellow or green funnel pheromone traps @ 5/acre with Helilure / Gossyplure. Plant okra or marigold as trap crop border.",
            "biological": "Release Trichogramma chilonis egg parasitoids @ 60,000/acre in 3 weekly installments. Spray Helicoverpa NPV (HaNPV) @ 250 LE/acre.",
            "botanical": "Spray 5% NSKE or Neem oil (1500 ppm) @ 3 ml/L at flower initiation stage.",
            "chemical": "Apply Spinosad 45% SC @ 0.3 ml/L or Flubendiamide 39.35% SC @ 0.25 ml/L if boll damage crosses economic threshold (>5%)."
        })

    # 4. Thrips & Mites
    if "thrips" in pest_keys or "spider_mites" in pest_keys:
        recs.append({
            "target": "Thrips & Mite Sucking Pest Complex",
            "threat_level": "Moderate to High",
            "cultural": "Install blue sticky traps for thrips and avoid water stress in field. Overhead sprinkler irrigation suppresses mite webs.",
            "biological": "Release predatory phytoseiid mites (Amblyseius spp.) or application of Beauveria bassiana.",
            "botanical": "Spray Pongamia (Karanja) oil or Neem oil @ 3 ml/L targeting undersides of leaves.",
            "chemical": "For thrips: Fipronil 5% SC @ 1.5 ml/L. For mites: Propargite 57% EC @ 2 ml/L or Fenpyroximate 5% EC @ 1 ml/L."
        })

    # 5. Yellow Stem Borer & BPH in Rice
    if "stem_borer" in pest_keys or "brown_planthopper" in pest_keys:
        recs.append({
            "target": "Paddy Stem Borer & Brown Planthopper (BPH)",
            "threat_level": "Critical",
            "cultural": "Clip rice seedling leaf tips prior to transplanting to eliminate egg masses. For BPH, adopt Alternate Wetting and Drying (AWD) and avoid continuous flooding.",
            "biological": "Install light traps (1/acre) and release Trichogramma japonicum parasitoids @ 40,000/acre. Preserve spiders (Lycosa pseudoannulata).",
            "botanical": "Spray Neem oil 3000 ppm @ 2 ml/L directed at tiller bases.",
            "chemical": "Stem Borer: Cartap Hydrochloride 50% SP @ 2 g/L. BPH: Pymetrozine 50% WDG @ 0.6 g/L or Triflumezopyrim 10% SC @ 0.5 ml/L directed to base."
        })

    # 6. Aphids & Mealybugs
    if "aphids" in pest_keys or "mealybug" in pest_keys:
        recs.append({
            "target": "Aphids & Mealybug Infestation",
            "threat_level": "Moderate",
            "cultural": "Prune and destroy severely infested shoot tips. Band tree trunks with 5 cm grease or polythene sheets to prevent ant movement.",
            "biological": "Release predatory Cryptolaemus montrouzieri (Australian ladybird beetle) @ 400 beetles/acre. Spray Lecanicillium lecanii @ 5g/L.",
            "botanical": "Spray 2% Fish Oil Rosin Soap (FORS) or Neem oil (1500 ppm) @ 4 ml/L with detergent.",
            "chemical": "Apply Thiamethoxam 25% WG @ 0.3 g/L or Buprofezin 25% SC @ 1.5 ml/L."
        })

    # 7. Blast / Blight / Rust Diseases
    if "blast" in disease_keys or "blight" in disease_keys or "rust" in disease_keys or "leaf_spot" in disease_keys:
        recs.append({
            "target": "Fungal Blight / Blast / Rust / Leaf Spot Complex",
            "threat_level": "High",
            "cultural": "Ensure balanced fertilizer application; split nitrogen doses into 3 stages and avoid late heavy nitrogen. Ensure good field aeration and crop spacing.",
            "biological": "Seed treatment and soil application with Trichoderma viride or Pseudomonas fluorescens @ 10 g/kg seed and 2.5 kg/acre in compost.",
            "botanical": "Foliar spray with Cow urine + Asafoetida solution or Fermented butter milk (Panchagavya 3%).",
            "chemical": "Blast: Tricyclazole 75% WP @ 0.6 g/L. Blight/Leaf Spot: Mancozeb 75% WP @ 2 g/L or Copper Oxychloride 50% WP @ 2.5 g/L."
        })

    # 8. Fruit and Shoot Borer (Brinjal, Tomato, Okra)
    if "fruit_borer" in pest_keys:
        recs.append({
            "target": "Fruit & Shoot Borer (Leucinodes / Helicoverpa)",
            "threat_level": "High",
            "cultural": "Regular clipping and destruction of withered terminal shoots and bored fruits. Avoid continuous solanaceous monoculture.",
            "biological": "Inundative release of Trichogramma chilonis @ 50,000/acre at weekly intervals. Spray Bacillus thuringiensis (Bt) kurstaki @ 2 g/L.",
            "botanical": "Spray cold-pressed Neem oil (1500 ppm) @ 3 ml/L at first flowering flush.",
            "chemical": "Foliar spray of Chlorantraniliprole 18.5% SC @ 0.4 ml/L or Emamectin Benzoate 5% SG @ 0.4 g/L during peak fruit set."
        })

    # 9. Serpentine Leaf Miner
    if "leaf_miner" in pest_keys:
        recs.append({
            "target": "Serpentine Leaf Miner (Liriomyza)",
            "threat_level": "Moderate",
            "cultural": "Hand-pick and burn older mined lower leaves. Install yellow sticky traps (10/acre) to trap adult flies.",
            "biological": "Conserve eulophid and braconid parasitoids (Diglyphus isaea). Spray entomopathogen Beauveria bassiana @ 5 g/L.",
            "botanical": "Foliar spray of 5% Neem Seed Kernel Extract (NSKE) or Neem oil 3 ml/L to inhibit oviposition.",
            "chemical": "Judicious spray of Cyantraniliprole 10.26% OD @ 1.8 ml/L or Abamectin 1.9% EC @ 0.5 ml/L."
        })

    # 10. Soil Cutworms & Termites
    if "cutworm" in pest_keys or "termites" in pest_keys:
        recs.append({
            "target": "Soil Pests (Cutworms & Subterranean Termites)",
            "threat_level": "Moderate to High",
            "cultural": "Deep summer ploughing to expose larvae and termite galleries to sunlight and bird predation. Clear unrotted crop stubble.",
            "biological": "Soil application of entomopathogenic nematode Heterorhabditis indica or Metarhizium anisopliae @ 2 kg/acre mixed with FYM.",
            "botanical": "Soil drenching with crushed neem cake suspension @ 50 kg/acre.",
            "chemical": "Cutworms: Chlorpyrifos 20% EC @ 2 ml/L drenched around collar region in late evening. Termites: Fipronil 0.3% G @ 10 kg/acre in furrow."
        })

    # 11. Root-Knot Nematodes
    if "root_knot_nematode" in pest_keys:
        recs.append({
            "target": "Root-Knot Nematode (Meloidogyne incognita)",
            "threat_level": "High",
            "cultural": "Intercrop or rotate with African marigold (Tagetes erecta). Solarize nursery soil with transparent polyethylene sheets for 4 weeks.",
            "biological": "Soil application of Purpureocillium lilacinum (Paecilomyces) @ 2 kg/acre enriched in well-decomposed FYM.",
            "botanical": "Incorporate Neem cake or Karanj cake @ 200 kg/acre into soil before transplanting.",
            "chemical": "Furrow application of Fluopyram 34.48% SC @ 2 ml/L or Cartap Hydrochloride 4G @ 8 kg/acre."
        })

    # 12. Wilt & Rot Pathogens (Fusarium, Pythium, Rhizoctonia, Red Rot)
    if "wilt" in disease_keys or "rot" in disease_keys or "red_rot" in disease_keys:
        recs.append({
            "target": "Soil-borne Wilt, Collar Rot & Red Rot Pathogens",
            "threat_level": "High",
            "cultural": "Improve field drainage to avoid water stagnation. Rogue out and burn wilted plants immediately. Avoid wounding roots during intercultural ops.",
            "biological": "Soil application of Trichoderma harzianum @ 2.5 kg/acre in 100 kg farmyard manure. Seed treatment with Pseudomonas fluorescens @ 10 g/kg seed.",
            "botanical": "Drenching with 10% ginger-garlic extract or fermented bio-slurry.",
            "chemical": "Soil drenching around plant basin with Carbendazim 12% + Mancozeb 63% WP @ 2 g/L or Metalaxyl-M + Mancozeb @ 2.5 g/L."
        })

    # 13. Locusts & Swarming Grasshoppers
    if "locust" in pest_keys:
        recs.append({
            "target": "Locust & Grasshopper Swarm Outbreak",
            "threat_level": "Critical",
            "cultural": "Dig 30 cm deep trenches around field borders to capture crawling hopper bands. Noise-making and drumming to prevent evening roosting.",
            "biological": "Aerial or mist blower spray of entomopathogenic fungus Metarhizium acridum (Green Muscle) @ 50 g/ha.",
            "botanical": "Foliar application of concentrated neem oil (10,000 ppm) @ 2 ml/L to create an antifeedant deterrence barrier.",
            "chemical": "Ultra-low-volume (ULV) spray of Malathion 96% ULV @ 1 L/ha or Chlorpyrifos 20% EC @ 2.5 ml/L during early dawn hours."
        })

    # Default general IPM if no specific rule matched but entities exist
    if not recs and (extracted_crops or extracted_pests or extracted_diseases):
        recs.append({
            "target": "General Integrated Pest & Crop Protection",
            "threat_level": "Moderate",
            "cultural": "Regular field scouting at 3-day intervals. Rogue out diseased or severely infested plants immediately to prevent pathogen spread.",
            "biological": "Promote conservation biological control by planting flowering border crops (cowpea, mustard, marigold) to attract parasitoid wasps and hoverflies.",
            "botanical": "Apply prophylactic foliar spray of cold-pressed Azadirachtin / Neem oil formulation (1500 ppm) @ 3 ml/L every 10–14 days.",
            "chemical": "Consult local Krishi Vigyan Kendra (KVK) or agricultural extension officer before using broad-spectrum synthetic pesticides."
        })

    return recs


@router.post("/extract-pest-crop")
async def extract_pests_and_crops(request: PestCropRequest):
    """
    Pest and Crop Extractor Feature:
    High-precision domain NLP extraction for Crops, Pests/Insects, Pathogen Diseases,
    and Damage Symptoms from unstructured agricultural text, along with cross-entity
    association, visual text span highlighting, and actionable IPM recommendations.
    """
    try:
        text = request.text
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty.")

        text_lower = text.lower()
        
        # 1. Extract Crops
        extracted_crops = []
        highlighted_spans = []

        for key, crop_data in CROP_DATABASE.items():
            matches = []
            for alias in crop_data["aliases"]:
                pattern = rf"\b{re.escape(alias)}s?\b"
                for m in re.finditer(pattern, text_lower):
                    matches.append((m.start(), m.end(), text[m.start():m.end()]))

            if matches:
                # Deduplicate overlapping spans
                unique_spans = []
                for start, end, orig in matches:
                    if not any(abs(start - s[0]) < 2 for s in unique_spans):
                        unique_spans.append((start, end, orig))
                
                extracted_crops.append({
                    "key": key,
                    "name": crop_data["name"],
                    "scientific_name": crop_data["scientific"],
                    "category": crop_data["category"],
                    "mentions_count": len(unique_spans),
                    "matched_tokens": [s[2] for s in unique_spans]
                })

                for s, e, orig in unique_spans:
                    highlighted_spans.append({
                        "start": s,
                        "end": e,
                        "text": orig,
                        "type": "crop",
                        "label": crop_data["name"]
                    })

        # 2. Extract Pests
        extracted_pests = []
        for key, pest_data in PEST_DATABASE.items():
            matches = []
            for alias in pest_data["aliases"]:
                pattern = rf"\b{re.escape(alias)}s?\b"
                for m in re.finditer(pattern, text_lower):
                    matches.append((m.start(), m.end(), text[m.start():m.end()]))

            if matches:
                unique_spans = []
                for start, end, orig in matches:
                    if not any(abs(start - s[0]) < 2 for s in unique_spans):
                        unique_spans.append((start, end, orig))
                
                extracted_pests.append({
                    "key": key,
                    "name": pest_data["name"],
                    "scientific_name": pest_data["scientific"],
                    "pest_type": pest_data["type"],
                    "damage_description": pest_data["damage"],
                    "severity": pest_data["severity"],
                    "mentions_count": len(unique_spans),
                    "matched_tokens": [s[2] for s in unique_spans],
                    "susceptible_crops": pest_data.get("susceptible_crops", [])
                })

                for s, e, orig in unique_spans:
                    highlighted_spans.append({
                        "start": s,
                        "end": e,
                        "text": orig,
                        "type": "pest",
                        "label": pest_data["name"]
                    })

        # 3. Extract Diseases
        extracted_diseases = []
        for key, disease_data in DISEASE_DATABASE.items():
            matches = []
            for alias in disease_data["aliases"]:
                pattern = rf"\b{re.escape(alias)}s?\b"
                for m in re.finditer(pattern, text_lower):
                    matches.append((m.start(), m.end(), text[m.start():m.end()]))

            if matches:
                unique_spans = []
                for start, end, orig in matches:
                    if not any(abs(start - s[0]) < 2 for s in unique_spans):
                        unique_spans.append((start, end, orig))
                
                extracted_diseases.append({
                    "key": key,
                    "name": disease_data["name"],
                    "scientific_name": disease_data["scientific"],
                    "disease_type": disease_data["type"],
                    "mentions_count": len(unique_spans),
                    "matched_tokens": [s[2] for s in unique_spans]
                })

                for s, e, orig in unique_spans:
                    highlighted_spans.append({
                        "start": s,
                        "end": e,
                        "text": orig,
                        "type": "disease",
                        "label": disease_data["name"]
                    })

        # 4. Extract Symptoms
        extracted_symptoms = []
        for symptom_data in SYMPTOM_DATABASE:
            matches = []
            for alias in symptom_data["aliases"]:
                pattern = rf"\b{re.escape(alias)}s?\b"
                for m in re.finditer(pattern, text_lower):
                    matches.append((m.start(), m.end(), text[m.start():m.end()]))

            if matches:
                unique_spans = []
                for start, end, orig in matches:
                    if not any(abs(start - s[0]) < 2 for s in unique_spans):
                        unique_spans.append((start, end, orig))
                
                extracted_symptoms.append({
                    "name": symptom_data["name"],
                    "mentions_count": len(unique_spans),
                    "matched_tokens": [s[2] for s in unique_spans]
                })

                for s, e, orig in unique_spans:
                    highlighted_spans.append({
                        "start": s,
                        "end": e,
                        "text": orig,
                        "type": "symptom",
                        "label": symptom_data["name"]
                    })

        # Sort highlighted spans by start position and resolve overlapping boundaries
        highlighted_spans.sort(key=lambda x: (x["start"], -(x["end"] - x["start"])))
        filtered_spans = []
        last_end = -1
        for span in highlighted_spans:
            if span["start"] >= last_end:
                filtered_spans.append(span)
                last_end = span["end"]

        # 5. Crop-Pest Association Matrix
        associations = []
        crop_keys = {c["key"]: c for c in extracted_crops}
        for pest in extracted_pests:
            for s_crop in pest.get("susceptible_crops", []):
                if s_crop in crop_keys:
                    crop_info = crop_keys[s_crop]
                    associations.append({
                        "crop_name": crop_info["name"],
                        "pest_name": pest["name"],
                        "threat_level": pest["severity"],
                        "interaction_note": f"{pest['name']} is a primary documented threat to {crop_info['name']}. {pest['damage_description']}."
                    })

        # 6. Integrated Pest Management (IPM) Recommendations
        ipm_recommendations = generate_ipm_recommendations(
            extracted_crops, extracted_pests, extracted_diseases
        )

        # 7. Overall Threat / Risk Assessment
        threat_levels = [p["severity"] for p in extracted_pests]
        if "Critical" in threat_levels:
            overall_risk = "Critical"
        elif "High" in threat_levels or len(extracted_pests) >= 2 or len(extracted_diseases) >= 2:
            overall_risk = "High"
        elif "Moderate" in threat_levels or extracted_pests or extracted_diseases:
            overall_risk = "Moderate"
        elif extracted_crops:
            overall_risk = "Low (Healthy / Informational)"
        else:
            overall_risk = "Unknown / No Threat Detected"

        return {
            "query_text": text,
            "metrics": {
                "total_crops": len(extracted_crops),
                "total_pests": len(extracted_pests),
                "total_diseases": len(extracted_diseases),
                "total_symptoms": len(extracted_symptoms),
                "overall_risk": overall_risk
            },
            "crops": extracted_crops,
            "pests": extracted_pests,
            "diseases": extracted_diseases,
            "symptoms": extracted_symptoms,
            "associations": associations,
            "ipm_recommendations": ipm_recommendations,
            "highlighted_spans": filtered_spans
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pest & Crop Extractor error: {str(e)}")

