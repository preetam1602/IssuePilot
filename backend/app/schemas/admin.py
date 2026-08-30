from pydantic import BaseModel


class IngestIssuesResponse(BaseModel):
    issues_ingested: int


class IngestEventsResponse(BaseModel):
    events_ingested: int


class BuildFeaturesResponse(BaseModel):
    issues_featurized: int


class ScoreResponse(BaseModel):
    scores_written: int
