from app.services import vbee_service


def test_uses_configured_batch_endpoint(monkeypatch) -> None:
    monkeypatch.setattr(vbee_service.settings, "VBEE_API_URL", "https://batch.example.test/tts")

    assert vbee_service._api_url() == "https://batch.example.test/tts"


def test_migrates_old_realtime_setting_to_batch_endpoint(monkeypatch) -> None:
    monkeypatch.setattr(vbee_service.settings, "VBEE_API_URL", "https://api.vbee.vn/v1/tts")

    assert vbee_service._api_url() == "https://vbee.vn/api/v1/tts"


def test_maps_supported_audio_format_to_media_type(monkeypatch) -> None:
    monkeypatch.setattr(vbee_service.settings, "VBEE_AUDIO_TYPE", "wav")

    assert vbee_service._media_type() == "audio/wav"
